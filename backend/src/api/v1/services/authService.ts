import { setInterval } from "timers";

import { AppError } from "middleware/errorHandler";
import { ERROR_MESSAGES, ErrorCode } from "constants/errorCodes";
import { sendEmail } from "utils/email";
import { PasswordUtils } from "utils/passwordUtils";
import { JwtUtils } from "utils/jwt";
import { BaseService } from "./baseService";

export class AuthService extends BaseService {
  static async storeRefreshToken(token: string, userId: string) {
    return await this.handleDatabaseError(async () => {
      await this.prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    });
  }

  static async cleanupExpiredTokens(userId?: string) {
    return await this.handleDatabaseError(async () => {
      const whereClause = {
        expiresAt: { lt: new Date() },
        ...(userId ? { userId } : {}),
      };

      await this.prisma.refreshToken.deleteMany({
        where: whereClause,
      });
    });
  }

  static async cleanupExpiredPasswordResetTokens() {
    return await this.handleDatabaseError(async () => {
      await this.prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
    });
  }

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

  static async register(email: string, password: string, name: string) {
    return await this.handleDatabaseError(async () => {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AppError(ErrorCode.EMAIL_EXISTS);
      }

      const hashedPassword = await PasswordUtils.hashPassword(password);

      const user = await this.prisma.user.create({
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
    });
  }

  static async login(email: string, password: string) {
    return await this.handleDatabaseError(async () => {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        throw new AppError(ErrorCode.INVALID_CREDENTIALS);
      }

      await this.cleanupExpiredTokens(user.id);

      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        user.password
      );
      if (!isPasswordValid) {
        throw new AppError(ErrorCode.INVALID_CREDENTIALS);
      }

      const { accessToken, refreshToken } = JwtUtils.generateTokens({
        userId: user.id,
        email: user.email || "",
        role: user.role || "",
      });

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
    });
  }

  static async refreshToken(refreshToken: string) {
    return await this.handleDatabaseError(async () => {
      if (!refreshToken) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      const decoded = JwtUtils.verifyRefreshToken(refreshToken);

      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: { gt: new Date() },
        },
      });

      if (!storedToken) {
        throw new AppError(ErrorCode.INVALID_REFRESH_TOKEN);
      }

      const { accessToken, refreshToken: newRefreshToken } =
        JwtUtils.generateTokens({
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        });

      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  static async logout(refreshToken: string) {
    return await this.handleDatabaseError(async () => {
      if (!refreshToken) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    });
  }

  static async handleGoogleCallback(
    user: any,
    tokens: any,
    passportError?: any
  ) {
    return await this.handleDatabaseError(async () => {
      if (passportError) {
        throw new AppError(
          ErrorCode.AUTHENTICATION_FAILED,
          `${ERROR_MESSAGES[ErrorCode.AUTHENTICATION_FAILED]}: ${
            passportError.message
          }`
        );
      }

      if (!user || !tokens) {
        throw new AppError(ErrorCode.INVALID_USER_DATA);
      }

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
    });
  }

  static async forgotPassword(email: string) {
    return await this.handleDatabaseError(async () => {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          message:
            "If an account exists with this email, you will receive a password reset link",
        };
      }

      const recentAttempts = await this.prisma.passwordResetToken.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentAttempts >= 3) {
        throw new AppError(ErrorCode.TOO_MANY_RESET_ATTEMPTS);
      }

      const resetToken = JwtUtils.generatePasswordResetToken(user.id);

      await this.prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

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
    });
  }

  static async resetPassword(token: string, newPassword: string) {
    return await this.handleDatabaseError(async () => {
      if (!token) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      const { userId } = JwtUtils.verifyPasswordResetToken(token);

      const resetToken = await this.prisma.passwordResetToken.findFirst({
        where: {
          token: token,
          userId: userId,
          expiresAt: { gt: new Date() },
        },
      });

      if (!resetToken) {
        throw new AppError(ErrorCode.INVALID_RESET_TOKEN);
      }

      const hashedPassword = await PasswordUtils.hashPassword(newPassword);

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        }),
        this.prisma.passwordResetToken.deleteMany({
          where: { userId: userId },
        }),
      ]);

      return { message: "Password reset successful" };
    });
  }
}
