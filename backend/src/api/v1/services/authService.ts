import { DateTime } from "luxon";

import { BaseService } from "./shared/baseService";
import { AppError } from "middleware/errorHandler";
import { sendEmail } from "utils/emailUtils";
import { PasswordUtils } from "utils/passwordUtils";
import { JwtUtils, TokenPayload } from "utils/jwtUtils";
import { ERROR_MESSAGES, ErrorCode } from "constants/errorCodes";
import { PasswordService } from "./shared/passwordService";
import { AuthRepository } from "../repositories/authRepository";
import { redisTokenService } from "./shared/redisTokenService";

export class AuthService extends BaseService {
  private static authRepository = new AuthRepository(BaseService.prisma);

  static async storeRefreshToken(token: string, userId: string) {
    return await this.handleDatabaseError(async () => {
      const expiresIn = JwtUtils.getRefreshTokenExpirationInSeconds();
      await redisTokenService.setToken("REFRESH", token, userId, expiresIn);
    });
  }

  static async registerUser(email: string, password: string, name: string) {
    return await this.handleTransaction(async (tx) => {
      const existingUser = await this.authRepository.findUserByEmail(email);

      if (existingUser) {
        if (!existingUser.password && !existingUser.googleId) {
          throw new AppError(
            ErrorCode.PASSWORD_NOT_SET,
            "An account with this email already exists. Please check your email for the password creation link or request a new one."
          );
        }

        if (!existingUser.password && existingUser.googleId) {
          throw new AppError(ErrorCode.SOCIAL_AUTH_REQUIRED);
        }

        throw new AppError(ErrorCode.EMAIL_EXISTS);
      }

      const hashedPassword = await PasswordUtils.hashPassword(password);

      const userRole = await tx.role.findFirst({
        where: { name: "user" },
      });

      if (!userRole) {
        throw new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          "Default role not found"
        );
      }

      const user = await this.authRepository.createUser({
        email,
        password: hashedPassword,
        name,
        roleId: userRole.id,
      });

      const { accessToken, refreshToken } = JwtUtils.generateTokens({
        userId: user.id,
        email: user.email || "",
        role: userRole.name,
        isDeactivated: user.isDeactivated || false,
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

  static async loginUser(email: string, password: string) {
    return await this.handleTransaction(async (tx) => {
      const user = await this.authRepository.findUserByEmail(email);

      if (!user) {
        throw new AppError(ErrorCode.INVALID_CREDENTIALS);
      }

      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      if (!user.password && !user.googleId) {
        throw new AppError(ErrorCode.PASSWORD_NOT_SET);
      }

      if (!user.password && user.googleId) {
        throw new AppError(ErrorCode.SOCIAL_AUTH_REQUIRED);
      }

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

  static async refreshUserToken(refreshToken: string, accessToken: string) {
    if (!refreshToken || !accessToken) {
      throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
    }

    let decodedRefresh: TokenPayload;
    try {
      decodedRefresh = JwtUtils.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    let decodedAccess: TokenPayload;
    try {
      decodedAccess = JwtUtils.decodeToken(accessToken);
      if (decodedAccess.userId !== decodedRefresh.userId) {
        throw new AppError(ErrorCode.INVALID_TOKEN);
      }
    } catch {
      throw new AppError(ErrorCode.INVALID_TOKEN);
    }

    return await this.handleTransaction(async (tx) => {
      const user = await this.authRepository.findUserById(
        decodedRefresh.userId
      );

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      const storedUserId = await redisTokenService.getToken(
        "REFRESH",
        refreshToken
      );
      if (!storedUserId || storedUserId !== user.id) {
        throw new AppError(ErrorCode.INVALID_REFRESH_TOKEN);
      }

      const currentTime = DateTime.now().toSeconds();
      if (decodedAccess.exp && decodedAccess.exp > currentTime) {
        return { accessToken, refreshToken };
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        JwtUtils.generateTokens({
          userId: decodedRefresh.userId,
          email: decodedRefresh.email,
          role: user.role.name,
          isDeactivated: user.isDeactivated || false,
        });

      await this.storeRefreshToken(newRefreshToken, user.id);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  static async logoutUser(refreshToken: string) {
    return await this.handleDatabaseError(async () => {
      if (!refreshToken) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      await redisTokenService.deleteToken("REFRESH", refreshToken);
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

      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
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

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    return await this.handleDatabaseError(async () => {
      const user = await this.authRepository.findUserById(userId);

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

      await this.authRepository.updateUser(userId, {
        password: hashedPassword,
      });

      return { message: "Password changed successfully" };
    });
  }

  static async requestPasswordReset(email: string) {
    return await this.handleWithTimeout(async () => {
      return await this.handleTransaction(async (tx) => {
        const user = await this.authRepository.findUserByEmail(email);

        if (!user) {
          return {
            message:
              "If an account exists with this email, you will receive a password reset link",
          };
        }

        if (user.isDeactivated) {
          throw new AppError(
            ErrorCode.ACCOUNT_DEACTIVATED,
            "Your account has been deactivated. Please contact support for assistance."
          );
        }

        const resetToken = JwtUtils.generatePasswordToken(user.id, "1h");
        const expiresIn = 60 * 60; // 1 hour in seconds

        await redisTokenService.setToken(
          "PASSWORD_RESET",
          resetToken,
          user.id,
          expiresIn
        );

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
    }, 15000);
  }

  static async resetUserPassword(token: string, newPassword: string) {
    return await this.handleTransaction(async (tx) => {
      if (!token) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      const { userId } = JwtUtils.verifyPasswordToken(token);

      const user = await this.authRepository.findUserById(userId);

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      const storedUserId = await redisTokenService.getToken(
        "PASSWORD_RESET",
        token
      );
      if (!storedUserId || storedUserId !== userId) {
        throw new AppError(ErrorCode.INVALID_RESET_TOKEN);
      }

      const hashedPassword = await PasswordUtils.hashPassword(newPassword);

      await Promise.all([
        this.authRepository.updateUser(userId, { password: hashedPassword }),
        redisTokenService.deleteToken("PASSWORD_RESET", token),
      ]);

      return { message: "Password reset successful" };
    });
  }

  static async deactivateUserAccount(userId: string) {
    return await this.handleTransaction(async (tx) => {
      const activeAppointments = await tx.appointment.findMany({
        where: {
          OR: [{ userId }, { stylistId: userId }],
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

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

      await Promise.all([
        redisTokenService.deleteAllUserTokens("REFRESH", userId),
        redisTokenService.deleteAllUserTokens("PASSWORD_RESET", userId),
        this.authRepository.deactivateUser(userId),
      ]);
    });
  }

  static async updateUserProfile(
    userId: string,
    data: { name: string; phone?: string }
  ) {
    return await this.handleDatabaseError(async () => {
      const user = await this.authRepository.findUserById(userId);

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      const updatedUser = await this.authRepository.updateUser(userId, {
        name: data.name,
        phone: data.phone,
      });

      return {
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          phone: updatedUser.phone,
        },
      };
    });
  }

  static async requestNewPasswordCreationToken(email: string) {
    return await this.handleTransaction(async (tx) => {
      const user = await this.authRepository.findUserByEmail(email);

      if (!user) {
        return {
          message:
            "If an account exists with this email, you will receive a password creation link",
        };
      }

      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      if (user.password) {
        throw new AppError(ErrorCode.PASSWORD_ALREADY_SET);
      }

      await PasswordService.generateAndSendPasswordCreationToken(
        user.id,
        email
      );

      return {
        message:
          "If an account exists with this email, you will receive a password creation link",
      };
    });
  }

  static async createPassword(token: string, password: string) {
    return await this.handleTransaction(async (tx) => {
      if (!token) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      const { userId } = JwtUtils.verifyPasswordToken(token);

      const user = await this.authRepository.findUserById(userId);

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      const storedUserId = await redisTokenService.getToken(
        "PASSWORD_CREATION",
        token
      );
      if (!storedUserId || storedUserId !== userId) {
        throw new AppError(ErrorCode.INVALID_PASSWORD_CREATION_TOKEN);
      }

      const hashedPassword = await PasswordUtils.hashPassword(password);

      await Promise.all([
        this.authRepository.updateUser(userId, {
          password: hashedPassword,
        }),
        redisTokenService.deleteToken("PASSWORD_CREATION", token),
      ]);

      return { message: "Password created successfully" };
    });
  }
}
