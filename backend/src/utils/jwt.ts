import jwt from "jsonwebtoken";
import { AppError } from "../middleware/errorHandler";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class JwtUtils {
  static generateAccessToken(payload: TokenPayload): string {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(500, "JWT access secret is not configured");
    }
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new AppError(500, "JWT refresh secret is not configured");
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
      throw new AppError(500, "JWT access secret is not configured");
    }
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError(401, "Invalid access token");
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new AppError(500, "JWT refresh secret is not configured");
    }
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError(401, "Invalid refresh token");
    }
  }

  static generatePasswordResetToken(userId: string): string {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(500, "JWT access secret is not configured");
    }
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "1h",
    });
  }

  static verifyPasswordResetToken(token: string): { userId: string } {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new AppError(500, "JWT access secret is not configured");
    }
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET) as {
        userId: string;
      };
    } catch (error) {
      throw new AppError(400, "Invalid or expired reset token");
    }
  }
}
