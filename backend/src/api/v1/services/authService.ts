import { DateTime } from "luxon";
import { Request } from "express";

import { BaseService } from "./shared/baseService";
import { AppError } from "middleware/errorHandler";
import { PasswordUtils } from "utils/passwordUtils";
import { JwtUtils, TokenPayload } from "utils/jwtUtils";
import { ERROR_MESSAGES, ErrorCode } from "constants/errorCodes";
import { passwordEmailService } from "./shared/passwordEmailService";
import { AuthRepository } from "../repositories/authRepository";
import { redisTokenService } from "./shared/redisTokenService";
import { createSuccessResponse, ApiResponse } from "utils/responseUtils";
import { DEFAULT_USER_ROLE } from "constants/userRoles";
import { AuthResponse } from "types/auth";

export class AuthService extends BaseService {
  private authRepository: AuthRepository;

  constructor() {
    super();
    this.authRepository = new AuthRepository(this.prisma);
  }

  async storeRefreshToken(token: string, userId: string) {
    return await this.handleDatabaseError(async () => {
      const expiresIn = JwtUtils.getRefreshTokenExpirationInSeconds();
      await redisTokenService.setToken("REFRESH", token, userId, expiresIn);
    });
  }

  async registerUser(
    req: Request,
    email: string,
    password: string,
    name: string
  ): Promise<ApiResponse<AuthResponse>> {
    return await this.handleTransaction(async (tx) => {
      const existingUser = await this.authRepository.findUserByEmail(email);

      if (existingUser) {
        if (!existingUser.password && !existingUser.googleId) {
          throw new AppError(ErrorCode.PASSWORD_NOT_SET);
        }

        if (!existingUser.password && existingUser.googleId) {
          throw new AppError(ErrorCode.SOCIAL_AUTH_REQUIRED);
        }

        throw new AppError(ErrorCode.EMAIL_EXISTS);
      }

      const hashedPassword = await PasswordUtils.hashPassword(password);

      const userRole = await tx.role.findFirst({
        where: { name: DEFAULT_USER_ROLE },
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

      return createSuccessResponse(
        req,
        {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        "User registered successfully"
      );
    });
  }

  async loginUser(
    req: Request,
    email: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> {
    return await this.handleTransaction(async (tx) => {
      const user = await this.authRepository.findUserByEmail(email);

      if (!user) {
        throw new AppError(ErrorCode.INVALID_CREDENTIALS);
      }

      if (user.isDeactivated) {
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
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

      return createSuccessResponse(
        req,
        {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        "User logged in successfully"
      );
    });
  }

  async refreshUserToken(refreshToken: string, accessToken: string) {
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
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
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

  async logoutUser(refreshToken: string) {
    return await this.handleDatabaseError(async () => {
      if (!refreshToken) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      await redisTokenService.deleteToken("REFRESH", refreshToken);
    });
  }

  async handleGoogleCallback(user: any, tokens: any, passportError?: any) {
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
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
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

  async changePassword(
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

  async requestPasswordReset(email: string) {
    return await this.handleDatabaseError(async () => {
      const user = await this.authRepository.findUserByEmail(email);

      if (!user) {
        return {
          message:
            "If an account exists with this email, you will receive a password reset link",
        };
      }

      if (user.isDeactivated) {
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
      }

      await passwordEmailService.generateAndSendPasswordResetToken(
        user.id,
        email
      );

      return {
        message:
          "If an account exists with this email, you will receive a password reset link",
      };
    });
  }

  async resetUserPassword(token: string, newPassword: string) {
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
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
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

  async deactivateUserAccount(userId: string) {
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

  async updateUserProfile(
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

  async requestNewPasswordCreationToken(email: string) {
    return await this.handleDatabaseError(async () => {
      const user = await this.authRepository.findUserByEmail(email);

      if (!user) {
        return {
          message:
            "If an account exists with this email, you will receive a password creation link",
        };
      }

      if (user.isDeactivated) {
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
      }

      if (user.password) {
        throw new AppError(ErrorCode.PASSWORD_ALREADY_SET);
      }

      await passwordEmailService.generateAndSendPasswordCreationToken(
        user.id,
        email
      );

      return {
        message:
          "If an account exists with this email, you will receive a password creation link",
      };
    });
  }

  async createPassword(token: string, password: string) {
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
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
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
