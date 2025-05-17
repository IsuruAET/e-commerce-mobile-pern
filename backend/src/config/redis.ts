import { createClient, RedisClientType } from "redis";
import { logger } from "middleware/logger";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import dotenv from "dotenv";

dotenv.config();

const redisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  retryAttempts: 5,
  retryDelay: 1000,
  maxRetries: 5,
  connectionTimeout: 5000,
  circuitBreakerThreshold: 3,
  circuitBreakerTimeout: 30000,
};

class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType;
  private isConnected: boolean = false;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private isCircuitOpen: boolean = false;

  private constructor() {
    this.client = createClient({
      url: redisConfig.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (this.isCircuitOpen) {
            if (
              Date.now() - this.lastFailureTime >=
              redisConfig.circuitBreakerTimeout
            ) {
              this.resetCircuitBreaker();
            } else {
              return new Error("Circuit breaker is open");
            }
          }

          this.failureCount++;
          if (this.failureCount >= redisConfig.circuitBreakerThreshold) {
            this.openCircuitBreaker();
            return new Error("Circuit breaker opened");
          }

          if (retries <= redisConfig.maxRetries) {
            const delay = Math.min(retries * redisConfig.retryDelay, 3000);
            return delay;
          }

          return new Error("Max reconnection attempts reached");
        },
        connectTimeout: redisConfig.connectionTimeout,
      },
    });

    this.setupEventListeners();
    this.setupProcessHandlers();
  }

  private setupEventListeners(): void {
    this.client.on("error", () => {
      this.isConnected = false;
      this.failureCount++;
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      this.resetCircuitBreaker();
    });

    this.client.on("end", () => {
      this.isConnected = false;
    });
  }

  private setupProcessHandlers(): void {
    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  private openCircuitBreaker(): void {
    this.isCircuitOpen = true;
    this.lastFailureTime = Date.now();
  }

  private resetCircuitBreaker(): void {
    this.isCircuitOpen = false;
    this.failureCount = 0;
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    let attempts = 0;
    while (attempts < redisConfig.retryAttempts) {
      try {
        await this.client.connect();
        this.isConnected = true;
        logger.info("Redis connected successfully");
        return;
      } catch (error) {
        attempts++;
        logger.error(`Redis connection attempt ${attempts} failed:`);

        if (attempts === redisConfig.retryAttempts) {
          logger.error("Redis circuit breaker opened");
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
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis connection closed");
    } catch (error) {
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

export const redisConnection = RedisConnection.getInstance();

export const getRedisClient = async () => {
  await redisConnection.connect();
  return redisConnection.getClient();
};

export const connectRedis = async (): Promise<void> => {
  await redisConnection.connect();
};
