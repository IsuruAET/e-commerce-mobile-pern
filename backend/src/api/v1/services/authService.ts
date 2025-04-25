import { setInterval } from "timers";
import { DateTime } from "luxon";
import jwt from "jsonwebtoken";

import { BaseService } from "./baseService";
import { AppError } from "middleware/errorHandler";
import { sendEmail } from "utils/emailUtils";
import { PasswordUtils } from "utils/passwordUtils";
import { JwtUtils, TokenPayload } from "utils/jwtUtils";
import { ERROR_MESSAGES, ErrorCode } from "constants/errorCodes";
import { logger } from "middleware/logger";

export class AuthService extends BaseService {
  static async storeRefreshToken(token: string, userId: string) {
    return await this.handleDatabaseError(async () => {
      await this.prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt: JwtUtils.getRefreshTokenExpirationDate(), // 7 days
        },
      });
    });
  }

  static async cleanupExpiredTokens(userId?: string) {
    return await this.handleDatabaseError(async () => {
      const whereClause = {
        expiresAt: { lt: DateTime.now().toJSDate() },
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
          expiresAt: { lt: DateTime.now().toJSDate() },
        },
      });
    });
  }

  static startCleanupScheduler(intervalHours: number = 24) {
    setInterval(async () => {
      try {
        await this.cleanupExpiredTokens();
        await this.cleanupExpiredPasswordResetTokens();
        logger.info(`Cleaned up expired tokens at ${DateTime.now().toISO()}`);
      } catch (error) {
        logger.error("Error cleaning up expired tokens:", error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  static async registerUser(email: string, password: string, name: string) {
    return await this.handleTransaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // If user exists but has no password or Google ID, guide them to set password
        if (!existingUser.password && !existingUser.googleId) {
          throw new AppError(
            ErrorCode.PASSWORD_NOT_SET,
            "An account with this email already exists. Please check your email for the password creation link or request a new one."
          );
        }

        // If user exists with Google ID, suggest using Google login
        if (!existingUser.password && existingUser.googleId) {
          throw new AppError(ErrorCode.SOCIAL_AUTH_REQUIRED);
        }

        // If user exists with password, show regular email exists message
        throw new AppError(ErrorCode.EMAIL_EXISTS);
      }

      const hashedPassword = await PasswordUtils.hashPassword(password);

      // Get the default USER role
      const userRole = await tx.role.findFirst({
        where: { name: "USER" },
      });

      if (!userRole) {
        throw new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          "Default role not found"
        );
      }

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          roleId: userRole.id,
        },
      });

      const { accessToken, refreshToken } = JwtUtils.generateTokens({
        userId: user.id,
        email: user.email || "",
        role: userRole.name,
        isDeactivated: user.isDeactivated || false,
      });

      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: JwtUtils.getRefreshTokenExpirationDate(), // 7 days
        },
      });

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

  static async loginUser(email: string, password: string) {
    return await this.handleTransaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new AppError(ErrorCode.INVALID_CREDENTIALS);
      }

      // Check if user is deactivated
      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      // Check if user needs to set password
      if (!user.password && !user.googleId) {
        throw new AppError(ErrorCode.PASSWORD_NOT_SET);
      }

      // If user has no password but has Google ID, suggest using Google login
      if (!user.password && user.googleId) {
        throw new AppError(ErrorCode.SOCIAL_AUTH_REQUIRED);
      }

      await tx.refreshToken.deleteMany({
        where: {
          userId: user.id,
          expiresAt: { lt: DateTime.now().toJSDate() },
        },
      });

      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        user.password as string
      );
      if (!isPasswordValid) {
        throw new AppError(ErrorCode.INVALID_CREDENTIALS);
      }

      const { accessToken, refreshToken } = JwtUtils.generateTokens({
        userId: user.id,
        email: user.email || "",
        role: user.role.name,
        isDeactivated: user.isDeactivated || false,
      });

      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: JwtUtils.getRefreshTokenExpirationDate(), // 7 days
        },
      });

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

  static async refreshUserToken(refreshToken: string, accessToken?: string) {
    if (!refreshToken || !accessToken) {
      throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
    }

    let decodedRefresh: TokenPayload;
    try {
      decodedRefresh = JwtUtils.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    return await this.handleTransaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: decodedRefresh.userId },
      });

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      // Check if user is deactivated
      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      const storedToken = await tx.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decodedRefresh.userId,
          expiresAt: { gt: DateTime.now().toJSDate() },
        },
      });

      if (!storedToken) {
        throw new AppError(ErrorCode.INVALID_REFRESH_TOKEN);
      }

      let decodedAccess: TokenPayload;
      try {
        decodedAccess = JwtUtils.verifyAccessToken(accessToken);

        if (decodedAccess.userId !== decodedRefresh.userId) {
          throw new AppError(ErrorCode.INVALID_TOKEN);
        }

        // If access token is valid, return existing tokens
        return { accessToken, refreshToken };
      } catch (error) {
        // Only generate new tokens if the error is due to token expiration
        if (error instanceof jwt.TokenExpiredError) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            JwtUtils.generateTokens({
              userId: decodedRefresh.userId,
              email: decodedRefresh.email,
              role: decodedRefresh.role,
              isDeactivated: decodedRefresh?.isDeactivated || false,
            });

          await tx.refreshToken.update({
            where: { id: storedToken.id },
            data: {
              token: newRefreshToken,
              expiresAt: JwtUtils.getRefreshTokenExpirationDate(),
            },
          });

          return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          };
        }

        // For other token errors, throw invalid token error
        throw new AppError(ErrorCode.INVALID_TOKEN);
      }
    });
  }

  static async logoutUser(refreshToken: string) {
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

      // Check if user is deactivated
      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      await this.prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: JwtUtils.getRefreshTokenExpirationDate(), // 7 days
        },
      });

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

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    return await this.handleDatabaseError(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user || !user.password) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      const isPasswordValid = await PasswordUtils.comparePassword(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        throw new AppError(ErrorCode.INVALID_CREDENTIALS);
      }

      const hashedPassword = await PasswordUtils.hashPassword(newPassword);

      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { message: "Password changed successfully" };
    });
  }

  static async requestPasswordReset(email: string) {
    return await this.handleWithTimeout(async () => {
      return await this.handleTransaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { email },
        });

        if (!user) {
          return {
            message:
              "If an account exists with this email, you will receive a password reset link",
          };
        }

        // Check if user is deactivated
        if (user.isDeactivated) {
          throw new AppError(
            ErrorCode.ACCOUNT_DEACTIVATED,
            "Your account has been deactivated. Please contact support for assistance."
          );
        }

        const recentAttempts = await tx.passwordResetToken.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: DateTime.now().minus({ days: 1 }).toJSDate(),
            },
          },
        });

        if (recentAttempts >= 3) {
          throw new AppError(ErrorCode.TOO_MANY_PASSWORD_ATTEMPTS);
        }

        const resetToken = JwtUtils.generatePasswordToken(user.id, "1h");
        const expiresAt = DateTime.now().plus({ hours: 1 }).toJSDate();

        await tx.passwordResetToken.create({
          data: {
            token: resetToken,
            userId: user.id,
            expiresAt, // 1 hour
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
    }, 15000); // 15 second timeout due to email sending
  }

  static async resetUserPassword(token: string, newPassword: string) {
    return await this.handleTransaction(async (tx) => {
      if (!token) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      const { userId } = JwtUtils.verifyPasswordToken(token);

      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      // Check if user is deactivated
      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      const resetToken = await tx.passwordResetToken.findFirst({
        where: {
          token: token,
          userId: userId,
          expiresAt: { gt: DateTime.now().toJSDate() },
        },
      });

      if (!resetToken) {
        throw new AppError(ErrorCode.INVALID_RESET_TOKEN);
      }

      const hashedPassword = await PasswordUtils.hashPassword(newPassword);

      await Promise.all([
        tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        }),
        tx.passwordResetToken.deleteMany({
          where: { userId: userId },
        }),
      ]);

      return { message: "Password reset successful" };
    });
  }

  static async deactivateUserAccount(userId: string) {
    return await this.handleTransaction(async (tx) => {
      // Find all active appointments
      const activeAppointments = await tx.appointment.findMany({
        where: {
          OR: [{ userId }, { stylistId: userId }],
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      // Update all active appointments to CANCELLED with a note
      if (activeAppointments.length > 0) {
        await tx.appointment.updateMany({
          where: {
            id: {
              in: activeAppointments.map((appointment) => appointment.id),
            },
          },
          data: {
            status: "CANCELLED",
            notes: "Appointment cancelled due to account deactivation",
          },
        });
      }

      // Delete all refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // Delete all password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: { userId },
      });

      // Deactivate the user
      await tx.user.update({
        where: { id: userId },
        data: {
          isDeactivated: true,
          deactivatedAt: DateTime.now().toJSDate(),
        },
      });
    });
  }
}
