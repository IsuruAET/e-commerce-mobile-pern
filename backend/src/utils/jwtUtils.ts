import jwt from "jsonwebtoken";
import { DateTime } from "luxon";

import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
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

  static generatePasswordResetToken(userId: string): string {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
    }
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "1h",
    });
  }

  static verifyPasswordResetToken(token: string): { userId: string } {
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

  static getRefreshTokenExpirationDate(days: number = 7): Date {
    return DateTime.now().plus({ days }).toJSDate();
  }
}
