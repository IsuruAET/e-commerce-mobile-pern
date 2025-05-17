import { RedisClientType } from "redis";
import { logger } from "middleware/logger";
import { redisConnection, getRedisClient } from "config/redis";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

export type TokenType = "REFRESH" | "PASSWORD_RESET" | "PASSWORD_CREATION";

interface TokenConfig {
  prefix: string;
  defaultExpiry: number;
}

export class RedisTokenService {
  private client: RedisClientType | null = null;
  private readonly PREFIX: Record<TokenType, string> = {
    REFRESH: "refresh_token:",
    PASSWORD_RESET: "password_reset_token:",
    PASSWORD_CREATION: "password_creation_token:",
  };

  private readonly TOKEN_CONFIG: Record<TokenType, TokenConfig> = {
    REFRESH: {
      prefix: "refresh_token:",
      defaultExpiry: 7 * 24 * 60 * 60, // 7 days in seconds
    },
    PASSWORD_RESET: {
      prefix: "password_reset_token:",
      defaultExpiry: 1 * 60 * 60, // 1 hour in seconds
    },
    PASSWORD_CREATION: {
      prefix: "password_creation_token:",
      defaultExpiry: 24 * 60 * 60, // 24 hours in seconds
    },
  };

  private async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = await getRedisClient();
    }
    return this.client;
  }

  private getKey(type: TokenType, token: string): string {
    return `${this.PREFIX[type]}${token}`;
  }

  private async ensureConnection(): Promise<void> {
    if (!redisConnection.isClientConnected()) {
      await redisConnection.connect();
    }
  }

  async setToken(
    type: TokenType,
    token: string,
    userId: string,
    expiresIn?: number
  ): Promise<void> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      const key = this.getKey(type, token);
      const expiry = expiresIn || this.TOKEN_CONFIG[type].defaultExpiry;

      await client.set(key, userId, {
        EX: expiry,
      });
      logger.debug(`Token set successfully for user ${userId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error setting ${type} token:`, error);
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to set ${type} token: ${errorMessage}`
      );
    }
  }

  async getToken(type: TokenType, token: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      const key = this.getKey(type, token);
      const value = await client.get(key);

      if (!value) {
        logger.debug(`No token found for type ${type}`);
        return null;
      }

      return value;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error getting ${type} token:`, error);
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to get ${type} token: ${errorMessage}`
      );
    }
  }

  async deleteToken(type: TokenType, token: string): Promise<void> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      const key = this.getKey(type, token);
      await client.del(key);
      logger.debug(`Token deleted successfully for type ${type}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error deleting ${type} token:`, error);
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to delete ${type} token: ${errorMessage}`
      );
    }
  }

  async deleteAllUserTokens(type: TokenType, userId: string): Promise<void> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      const pattern = `${this.PREFIX[type]}*`;
      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        logger.debug(`No tokens found for user ${userId}`);
        return;
      }

      const pipeline = client.multi();
      for (const key of keys) {
        const value = await client.get(key);
        if (value === userId) {
          pipeline.del(key);
        }
      }
      await pipeline.exec();
      logger.debug(`All tokens deleted for user ${userId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error deleting all ${type} tokens for user:`, error);
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to delete all ${type} tokens: ${errorMessage}`
      );
    }
  }

  async getTokenTTL(type: TokenType, token: string): Promise<number> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      const key = this.getKey(type, token);
      return await client.ttl(key);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error getting TTL for ${type} token:`, error);
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to get TTL for ${type} token: ${errorMessage}`
      );
    }
  }

  async refreshToken(
    type: TokenType,
    token: string,
    userId: string,
    newExpiry?: number
  ): Promise<void> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      const key = this.getKey(type, token);
      const expiry = newExpiry || this.TOKEN_CONFIG[type].defaultExpiry;

      const exists = await client.exists(key);
      if (!exists) {
        throw new AppError(
          ErrorCode.TOKEN_NOT_FOUND,
          `Token ${token} does not exist`
        );
      }

      await client.expire(key, expiry);
      logger.debug(`Token refreshed successfully for user ${userId}`);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error refreshing ${type} token:`, error);
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to refresh ${type} token: ${errorMessage}`
      );
    }
  }
}

export const redisTokenService = new RedisTokenService();
