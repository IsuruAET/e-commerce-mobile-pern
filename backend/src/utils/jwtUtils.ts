import jwt, { SignOptions } from "jsonwebtoken";

import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  isDeactivated: boolean;
  exp?: number;
}

export class JwtUtils {
  static generateAccessToken(payload: TokenPayload): string {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
    }
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
    }
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
  }

  static generateTokens(payload: TokenPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static verifyAccessToken(token: string): TokenPayload {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
    }
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError(ErrorCode.UNAUTHORIZED);
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
    }
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError(ErrorCode.UNAUTHORIZED);
    }
  }

  static generatePasswordToken(
    userId: string,
    expiresIn: SignOptions["expiresIn"] = "1h"
  ): string {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
    }
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
      expiresIn,
    });
  }

  static verifyPasswordToken(token: string): { userId: string } {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
    }
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET) as {
        userId: string;
      };
    } catch (error) {
      throw new AppError(ErrorCode.INVALID_RESET_TOKEN);
    }
  }

  static getRefreshTokenExpirationInSeconds(): number {
    return 7 * 24 * 60 * 60; // 7 days in seconds
  }

  static decodeToken(token: string): TokenPayload {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      throw new AppError(ErrorCode.INVALID_TOKEN);
    }
  }
}
