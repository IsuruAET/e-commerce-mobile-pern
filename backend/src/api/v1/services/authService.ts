import { PrismaClient } from "@prisma/client";
import { setInterval } from "timers";

import { AppError } from "middleware/errorHandler";
import { sendEmail } from "utils/email";
import { PasswordUtils } from "utils/passwordUtils";
import { JwtUtils } from "utils/jwt";

const prisma = new PrismaClient();

export class AuthService {
  static async storeRefreshToken(token: string, userId: string) {
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new AppError(401, "Invalid credentials");
    }

    // Clean up expired tokens for this user before creating new ones
    await this.cleanupExpiredTokens(user.id);

    const isPasswordValid = await PasswordUtils.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = JwtUtils.generateTokens({
      userId: user.id,
      email: user.email || "",
      role: user.role || "",
    });

    // Store refresh token in database
    await this.storeRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  // Add cleanup method for expired tokens
  static async cleanupExpiredTokens(userId?: string) {
    const whereClause = {
      expiresAt: { lt: new Date() },
      ...(userId ? { userId } : {}),
    };

    await prisma.refreshToken.deleteMany({
      where: whereClause,
    });
  }

  static async cleanupExpiredPasswordResetTokens() {
    await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  // Start the cleanup scheduler
  static startCleanupScheduler(intervalHours: number = 24) {
    setInterval(async () => {
      try {
        await this.cleanupExpiredTokens();
        await this.cleanupExpiredPasswordResetTokens();
        console.log(`Cleaned up expired tokens at ${new Date().toISOString()}`);
      } catch (error) {
        console.error("Error cleaning up expired tokens:", error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  static async refreshToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new AppError(401, "Refresh token not found");
      }

      const decoded = JwtUtils.verifyRefreshToken(refreshToken);

      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: { gt: new Date() },
        },
      });

      if (!storedToken) {
        throw new AppError(401, "Invalid refresh token");
      }

      const { accessToken, refreshToken: newRefreshToken } =
        JwtUtils.generateTokens({
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        });

      // Update refresh token in database
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError(401, "Invalid refresh token");
    }
  }

  static async logout(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new AppError(401, "Refresh token not found");
      }

      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } catch (error) {
      throw new AppError(401, "Invalid refresh token");
    }
  }

  static async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, "Email already exists");
    }

    // Hash password using PasswordUtils
    const hashedPassword = await PasswordUtils.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const { accessToken, refreshToken } = JwtUtils.generateTokens({
      userId: user.id,
      email: user.email || "",
      role: user.role || "USER",
    });

    // Store refresh token in database
    await this.storeRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  static async handleGoogleCallback(
    user: any,
    tokens: any,
    passportError?: any
  ) {
    if (passportError) {
      throw new AppError(
        401,
        "Authentication failed: " + passportError.message
      );
    }

    if (!user || !tokens) {
      throw new AppError(401, "Authentication failed: Invalid user data");
    }

    // Store refresh token in database
    await this.storeRefreshToken(tokens.refreshToken, user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return {
        message:
          "If an account exists with this email, you will receive a password reset link",
      };
    }

    // Check for recent reset attempts
    const recentAttempts = await prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (recentAttempts >= 3) {
      throw new AppError(
        429,
        "Too many password reset attempts. Please try again later."
      );
    }

    // Generate reset token
    const resetToken = JwtUtils.generatePasswordResetToken(user.id);

    // Store reset token in database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset password email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #333333; text-align: center; margin-bottom: 20px;">Password Reset Request</h1>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">This link will expire in 1 hour for security reasons.</p>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px; word-break: break-all;">${resetUrl}</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="color: #999999; font-size: 12px; text-align: center;">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      `,
    });

    return {
      message:
        "If an account exists with this email, you will receive a password reset link",
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token
      const { userId } = JwtUtils.verifyPasswordResetToken(token);

      // Find the reset token in database
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: token,
          userId: userId,
          expiresAt: { gt: new Date() },
        },
      });

      if (!resetToken) {
        throw new AppError(400, "Invalid or expired reset token");
      }

      // Hash new password using PasswordUtils
      const hashedPassword = await PasswordUtils.hashPassword(newPassword);

      // Update password and delete all reset tokens for this user
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        }),
        // Delete all reset tokens for this user
        prisma.passwordResetToken.deleteMany({
          where: { userId: userId },
        }),
      ]);

      return { message: "Password reset successful" };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, "Invalid or expired reset token");
    }
  }
}
