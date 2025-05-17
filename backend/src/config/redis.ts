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
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

const redisConfig: RedisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  retryAttempts: 5,
  retryDelay: 1000,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  maxRetries: 5,
  connectionTimeout: 5000,
  circuitBreakerThreshold: 3,
  circuitBreakerTimeout: 30000, // 30 seconds
};

class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private isCircuitOpen: boolean = false;

  private constructor() {
    this.client = createClient({
      url: redisConfig.url,
      socket: {
        reconnectStrategy: (retries) => {
          // Check if circuit breaker is open
          if (this.isCircuitOpen) {
            const now = Date.now();
            if (
              now - this.lastFailureTime >=
              redisConfig.circuitBreakerTimeout
            ) {
              // Reset circuit breaker after timeout
              this.isCircuitOpen = false;
              this.failureCount = 0;
              logger.info("Circuit breaker reset after timeout");
            } else {
              logger.warn(
                "Circuit breaker is open, skipping reconnection attempt"
              );
              return new Error("Circuit breaker is open");
            }
          }

          // Increment failure count
          this.failureCount++;

          // Check if we should open the circuit breaker
          if (this.failureCount >= redisConfig.circuitBreakerThreshold) {
            this.isCircuitOpen = true;
            this.lastFailureTime = Date.now();
            logger.error("Circuit breaker opened due to too many failures");
            return new Error("Circuit breaker opened");
          }

          // If we haven't reached max retries, try to reconnect
          if (retries <= redisConfig.maxRetries) {
            const delay = Math.min(retries * redisConfig.retryDelay, 3000);
            logger.info(
              `Attempting to reconnect in ${delay}ms (attempt ${retries + 1}/${
                redisConfig.maxRetries + 1
              })`
            );
            return delay;
          }

          // If we've reached max retries, stop trying
          logger.error("Max reconnection attempts reached");
          return new Error("Max reconnection attempts reached");
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
      this.failureCount++;

      // Check if we should open the circuit breaker
      if (this.failureCount >= redisConfig.circuitBreakerThreshold) {
        this.isCircuitOpen = true;
        this.lastFailureTime = Date.now();
        logger.error("Circuit breaker opened due to error");
      }
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      this.failureCount = 0;
      this.isCircuitOpen = false;
      logger.info("Redis connected successfully");
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
