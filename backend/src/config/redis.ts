import { createClient, RedisClientType } from "redis";
import { logger } from "middleware/logger";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import dotenv from "dotenv";

dotenv.config();

interface RedisConfig {
  url: string;
  retryAttempts: number;
  retryDelay: number;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  maxRetries: number;
  connectionTimeout: number;
}

const redisConfig: RedisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  retryAttempts: 5,
  retryDelay: 1000,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  maxRetries: 5,
  connectionTimeout: 5000,
};

class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    this.client = createClient({
      url: redisConfig.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > redisConfig.maxRetries) {
            logger.error("Max Redis reconnection attempts reached");
            return new Error("Max reconnection attempts reached");
          }
          return Math.min(retries * redisConfig.retryDelay, 3000);
        },
        connectTimeout: redisConfig.connectionTimeout,
      },
    });

    this.setupEventListeners();
    this.setupProcessHandlers();
  }

  private setupEventListeners(): void {
    this.client.on("error", (err: Error) => {
      logger.error("Redis Client Error:", err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      this.isConnected = true;
    });

    this.client.on("reconnecting", () => {
      logger.info("Redis Client Reconnecting...");
    });

    this.client.on("end", () => {
      logger.info("Redis Client Connection Ended");
      this.isConnected = false;
    });
  }

  private setupProcessHandlers(): void {
    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info("Using existing Redis connection");
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      let attempts = 0;

      while (attempts < redisConfig.retryAttempts) {
        try {
          await this.client.connect();
          this.isConnected = true;
          logger.info("Redis connected successfully");
          return;
        } catch (error) {
          attempts++;
          logger.error(`Redis connection attempt ${attempts} failed:`, error);

          if (attempts === redisConfig.retryAttempts) {
            throw new AppError(
              ErrorCode.DATABASE_ERROR,
              "Failed to connect to Redis"
            );
          }

          await new Promise((resolve) =>
            setTimeout(resolve, redisConfig.retryDelay)
          );
        }
      }
    })();

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis connection closed");
    } catch (error) {
      logger.error("Error while disconnecting Redis:", error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to disconnect from Redis"
      );
    }
  }

  public getClient(): RedisClientType {
    if (!this.isConnected) {
      throw new AppError(ErrorCode.DATABASE_ERROR, "Redis not connected");
    }
    return this.client;
  }

  public isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const redisConnection = RedisConnection.getInstance();

// Export a function that ensures connection before returning the client
export const getRedisClient = async () => {
  await redisConnection.connect();
  return redisConnection.getClient();
};

// Export connectRedis function for backward compatibility
export const connectRedis = async (): Promise<void> => {
  await redisConnection.connect();
};
