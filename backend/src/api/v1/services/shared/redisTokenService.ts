import { RedisClientType } from "redis";
import { redisConnection, getRedisClient } from "config/redis";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

export type TokenType = "REFRESH" | "PASSWORD_RESET" | "PASSWORD_CREATION";

const TOKEN_CONFIG = {
  REFRESH: {
    prefix: "refresh_token:",
    defaultExpiry: 7 * 24 * 60 * 60, // 7 days
  },
  PASSWORD_RESET: {
    prefix: "password_reset_token:",
    defaultExpiry: 60 * 60, // 1 hour
  },
  PASSWORD_CREATION: {
    prefix: "password_creation_token:",
    defaultExpiry: 24 * 60 * 60, // 24 hours
  },
} as const;

export class RedisTokenService {
  private client: RedisClientType | null = null;

  private async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = await getRedisClient();
    }
    return this.client;
  }

  private getKey(type: TokenType, token: string): string {
    return `${TOKEN_CONFIG[type].prefix}${token}`;
  }

  private async ensureConnection(): Promise<void> {
    if (!redisConnection.isClientConnected()) {
      await redisConnection.connect();
    }
  }

  private handleError(
    error: unknown,
    operation: string,
    type: TokenType
  ): never {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      `Failed to ${operation} ${type} token: ${errorMessage}`
    );
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
      const expiry = expiresIn || TOKEN_CONFIG[type].defaultExpiry;

      await client.set(key, userId, { EX: expiry });
    } catch (error) {
      this.handleError(error, "setting", type);
    }
  }

  async getToken(type: TokenType, token: string): Promise<string | null> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      return await client.get(this.getKey(type, token));
    } catch (error) {
      this.handleError(error, "getting", type);
    }
  }

  async deleteToken(type: TokenType, token: string): Promise<void> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      await client.del(this.getKey(type, token));
    } catch (error) {
      this.handleError(error, "deleting", type);
    }
  }

  async deleteAllUserTokens(type: TokenType, userId: string): Promise<void> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      const pattern = `${TOKEN_CONFIG[type].prefix}*`;
      const keys = await client.keys(pattern);

      if (keys.length === 0) return;

      const pipeline = client.multi();
      for (const key of keys) {
        const value = await client.get(key);
        if (value === userId) {
          pipeline.del(key);
        }
      }
      await pipeline.exec();
    } catch (error) {
      this.handleError(error, "deleting all", type);
    }
  }

  async getTokenTTL(type: TokenType, token: string): Promise<number> {
    try {
      await this.ensureConnection();
      const client = await this.getClient();
      return await client.ttl(this.getKey(type, token));
    } catch (error) {
      this.handleError(error, "getting TTL for", type);
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
      const expiry = newExpiry || TOKEN_CONFIG[type].defaultExpiry;

      const exists = await client.exists(key);
      if (!exists) {
        throw new AppError(
          ErrorCode.TOKEN_NOT_FOUND,
          `Token ${token} does not exist`
        );
      }

      await client.expire(key, expiry);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.handleError(error, "refreshing", type);
    }
  }
}

export const redisTokenService = new RedisTokenService();
