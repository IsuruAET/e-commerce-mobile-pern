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
import {
  AuthResponse,
  GoogleUser,
  GoogleTokens,
  ProfileUpdateResponse,
} from "types/auth";

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
          const hashedPassword = await PasswordUtils.hashPassword(password);
          await this.authRepository.updateUser(existingUser.id, {
            password: hashedPassword,
            ...(name && { name }), // Update name if provided
          });

          if (existingUser.isDeactivated) {
            throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
          }

          const { accessToken, refreshToken } = JwtUtils.generateTokens({
            userId: existingUser.id,
            email: existingUser.email || "",
            role: existingUser.role.name,
            isDeactivated: existingUser.isDeactivated || false,
          });

          await this.storeRefreshToken(refreshToken, existingUser.id);

          return createSuccessResponse(
            req,
            {
              accessToken,
              refreshToken,
              user: {
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name,
              },
            },
            "User registered successfully"
          );
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

  async refreshUserToken(
    req: Request,
    refreshToken: string,
    accessToken: string
  ): Promise<ApiResponse<AuthResponse>> {
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
        // Delete invalid token from Redis
        await redisTokenService.deleteToken("REFRESH", refreshToken);
        throw new AppError(ErrorCode.INVALID_REFRESH_TOKEN);
      }

      const currentTime = DateTime.now().toSeconds();
      if (decodedAccess.exp && decodedAccess.exp > currentTime) {
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
          "Token refresh not needed"
        );
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        JwtUtils.generateTokens({
          userId: decodedRefresh.userId,
          email: decodedRefresh.email,
          role: user.role.name,
          isDeactivated: user.isDeactivated || false,
        });

      await this.storeRefreshToken(newRefreshToken, user.id);

      return createSuccessResponse(
        req,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        "Tokens refreshed successfully"
      );
    });
  }

  async logoutUser(
    req: Request,
    refreshToken?: string
  ): Promise<ApiResponse<null>> {
    return await this.handleDatabaseError(async () => {
      if (refreshToken) {
        await redisTokenService.deleteToken("REFRESH", refreshToken);
      }
      return createSuccessResponse(req, null, "Logged out successfully");
    });
  }

  async handleGoogleCallback(
    req: Request,
    user: GoogleUser,
    tokens: GoogleTokens | null,
    passportError?: Error
  ): Promise<ApiResponse<AuthResponse>> {
    return await this.handleTransaction(async (tx) => {
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

      // Check if user exists
      const existingUser = await this.authRepository.findUserByEmail(
        user.email
      );
      if (existingUser) {
        if (existingUser.isDeactivated) {
          throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
        }

        // Link Google account to existing account
        user.id = existingUser.id;

        // Update Google ID if not set
        if (!existingUser.googleId) {
          await this.authRepository.updateUser(existingUser.id, {
            googleId: user.id,
          });
        }
      } else {
        // Create new user with Google ID
        const userRole = await tx.role.findFirst({
          where: { name: DEFAULT_USER_ROLE },
        });

        if (!userRole) {
          throw new AppError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            "Default role not found"
          );
        }

        const newUser = await this.authRepository.createUser({
          email: user.email,
          name: user.name,
          googleId: user.id,
          roleId: userRole.id,
        });

        // Replace Google ID with our database ID for token generation and user operations
        user.id = newUser.id;
      }

      // Generate tokens
      const { accessToken, refreshToken } = JwtUtils.generateTokens({
        userId: user.id,
        email: user.email,
        role: existingUser?.role.name || DEFAULT_USER_ROLE,
        isDeactivated: existingUser?.isDeactivated || false,
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
        "Google authentication successful"
      );
    });
  }

  async changePassword(
    req: Request,
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<null>> {
    return await this.handleTransaction(async (tx) => {
      const user = await this.authRepository.findUserById(userId);

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      if (user.isDeactivated) {
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
      }

      if (!user.password) {
        throw new AppError(ErrorCode.PASSWORD_NOT_SET);
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

      // Invalidate all refresh tokens for security
      await redisTokenService.deleteAllUserTokens("REFRESH", userId);

      return createSuccessResponse(
        req,
        null,
        "Password changed successfully. Please login again with your new password."
      );
    });
  }

  async requestPasswordReset(
    req: Request,
    email: string
  ): Promise<ApiResponse<null>> {
    return await this.handleTransaction(async (tx) => {
      const user = await this.authRepository.findUserByEmail(email);

      if (!user) {
        return createSuccessResponse(
          req,
          null,
          "Password reset email sent if account exists"
        );
      }

      if (user.isDeactivated) {
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
      }

      await passwordEmailService.generateAndSendPasswordResetToken(
        user.id,
        email
      );

      return createSuccessResponse(
        req,
        null,
        "Password reset email sent if account exists"
      );
    });
  }

  async resetUserPassword(
    req: Request,
    token: string,
    newPassword: string
  ): Promise<ApiResponse<AuthResponse>> {
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
        redisTokenService.deleteAllUserTokens("REFRESH", userId), // Invalidate all refresh tokens
      ]);

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
        "Password reset successful"
      );
    });
  }

  async deactivateUserAccount(
    req: Request,
    userId: string
  ): Promise<ApiResponse<null>> {
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

      return createSuccessResponse(
        req,
        null,
        "Account deactivated successfully"
      );
    });
  }

  async updateUserProfile(
    req: Request,
    userId: string,
    data: { name: string; phone?: string }
  ): Promise<ApiResponse<ProfileUpdateResponse>> {
    return await this.handleTransaction(async (tx) => {
      const user = await this.authRepository.findUserById(userId);

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      if (user.isDeactivated) {
        throw new AppError(ErrorCode.ACCOUNT_DEACTIVATED);
      }

      const updatedUser = await this.authRepository.updateUser(userId, {
        name: data.name,
        phone: data.phone,
      });

      return createSuccessResponse(
        req,
        {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            phone: updatedUser.phone,
          },
        },
        "Profile updated successfully"
      );
    });
  }

  async requestNewPasswordCreationToken(
    req: Request,
    email: string
  ): Promise<ApiResponse<null>> {
    return await this.handleTransaction(async (tx) => {
      const user = await this.authRepository.findUserByEmail(email);

      if (!user) {
        return createSuccessResponse(
          req,
          null,
          "Password create email sent if account exists"
        );
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

      return createSuccessResponse(
        req,
        null,
        "Password create email sent if account exists"
      );
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
