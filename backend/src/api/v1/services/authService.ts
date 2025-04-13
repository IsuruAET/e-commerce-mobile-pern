import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../../middleware/errorHandler";
import { setInterval } from "timers";

const prisma = new PrismaClient();

interface TokenPayload {
  userId: string;
  email: string;
}

export class AuthService {
  static generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, "Invalid credentials");
    }

    // Clean up expired tokens for this user before creating new ones
    await this.cleanupExpiredTokens(user.id);

    const { accessToken, refreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email || "",
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

  // Start the cleanup scheduler
  static startCleanupScheduler(intervalHours: number = 24) {
    setInterval(async () => {
      try {
        await this.cleanupExpiredTokens();
        console.log(
          `Cleaned up expired refresh tokens at ${new Date().toISOString()}`
        );
      } catch (error) {
        console.error("Error cleaning up expired tokens:", error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as TokenPayload;

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
        this.generateTokens({
          userId: decoded.userId,
          email: decoded.email,
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
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  static async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, "Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const { accessToken, refreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email || "",
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
}
