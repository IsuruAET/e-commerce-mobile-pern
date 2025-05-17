import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

import { AppError } from "middleware/errorHandler";
import { logger } from "middleware/logger";
import { ErrorCode } from "constants/errorCodes";

dotenv.config();

// Base PostgreSQL configuration
const baseConfig: PoolConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ecommerce",
  password: process.env.DB_PASSWORD || "postgres",
  port: parseInt(process.env.DB_PORT || "5432"),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Additional configuration for our connection management
const connectionConfig = {
  retryAttempts: 5,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 30000,
};

class Database {
  private static instance: Database;
  private pool: Pool | null = null;
  private isConnected: boolean = false;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private isCircuitOpen: boolean = false;

  private constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
  }

  private openCircuitBreaker(): void {
    this.isCircuitOpen = true;
    this.lastFailureTime = Date.now();
    logger.error("Database circuit breaker opened");
  }

  private resetCircuitBreaker(): void {
    this.isCircuitOpen = false;
    this.failureCount = 0;
  }

  private async createDatabaseIfNotExists(): Promise<void> {
    const tempPool = new Pool({ ...baseConfig, database: "postgres" });
    const client = await tempPool.connect();

    try {
      const result = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [baseConfig.database]
      );

      if (result.rows.length === 0) {
        await client.query(`CREATE DATABASE ${baseConfig.database}`);
        logger.info(`Database ${baseConfig.database} created successfully`);
      }
    } catch (error) {
      logger.error("Failed to create database:", error);
      throw new AppError(ErrorCode.DATABASE_ERROR, "Failed to create database");
    } finally {
      client.release();
      await tempPool.end();
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info("Using existing database connection");
      return;
    }

    if (this.isCircuitOpen) {
      if (
        Date.now() - this.lastFailureTime >=
        connectionConfig.circuitBreakerTimeout
      ) {
        this.resetCircuitBreaker();
        logger.info("Database circuit breaker reset after timeout");
      } else {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Database circuit breaker is open"
        );
      }
    }

    let attempts = 0;
    while (attempts < connectionConfig.retryAttempts) {
      try {
        await this.createDatabaseIfNotExists();
        this.pool = new Pool(baseConfig);

        // Test connection
        const client = await this.pool.connect();
        client.release();

        this.isConnected = true;
        this.resetCircuitBreaker();
        logger.info("PostgreSQL connected successfully");

        this.pool.on("error", (err) => {
          logger.error("Unexpected error on idle client", err);
          this.isConnected = false;
          this.failureCount++;

          if (this.failureCount >= connectionConfig.circuitBreakerThreshold) {
            this.openCircuitBreaker();
          }
        });

        return;
      } catch (error) {
        attempts++;
        this.failureCount++;
        logger.error(`Database connection attempt ${attempts} failed:`, error);

        if (this.failureCount >= connectionConfig.circuitBreakerThreshold) {
          this.openCircuitBreaker();
          throw new AppError(
            ErrorCode.DATABASE_ERROR,
            "Database circuit breaker opened"
          );
        }

        if (attempts === connectionConfig.retryAttempts) {
          throw new AppError(
            ErrorCode.DATABASE_ERROR,
            "Failed to connect to database"
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, connectionConfig.retryDelay)
        );
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.pool) return;

    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info("Database connection closed");
    } catch (error) {
      logger.error("Error while disconnecting:", error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to disconnect from database"
      );
    }
  }

  public getPool(): Pool {
    if (!this.pool) {
      throw new AppError(ErrorCode.DATABASE_ERROR, "Database not connected");
    }
    return this.pool;
  }

  public isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export utility functions
export const getDatabasePool = async () => {
  await database.connect();
  return database.getPool();
};

export const connectDB = async (): Promise<void> => {
  await database.connect();
};

export { Database };
