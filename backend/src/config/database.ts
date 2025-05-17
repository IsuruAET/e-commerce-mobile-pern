import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

import { AppError } from "middleware/errorHandler";
import { logger } from "middleware/logger";
import { ErrorCode } from "constants/errorCodes";

dotenv.config();

// Database configuration interface
interface DatabaseConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  retryAttempts: number;
  retryDelay: number;
}

// Custom error class for database operations
class DatabaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "DatabaseError";
  }
}

class Database {
  private static instance: Database;
  private pool: Pool | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private readonly config: DatabaseConfig = {
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "ecommerce",
    password: process.env.DB_PASSWORD || "postgres",
    port: parseInt(process.env.DB_PORT || "5432"),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    retryAttempts: 5,
    retryDelay: 1000,
  };

  private constructor() {
    this.setupEventHandlers();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async createDatabaseIfNotExists(): Promise<void> {
    const tempConfig: PoolConfig = {
      ...this.config,
      database: "postgres",
    };

    const tempPool = new Pool(tempConfig);
    const client = await tempPool.connect();

    try {
      const result = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [this.config.database]
      );

      if (result.rows.length === 0) {
        await client.query(`CREATE DATABASE ${this.config.database}`);
        logger.info(`Database ${this.config.database} created successfully`);
      }
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, "Failed to create database");
    } finally {
      client.release();
      await tempPool.end();
    }
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

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info("Using existing database connection");
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      let attempts = 0;

      while (attempts < this.config.retryAttempts) {
        try {
          await this.createDatabaseIfNotExists();

          this.pool = new Pool(this.config);

          // Test the connection
          const client = await this.pool.connect();
          client.release();

          this.isConnected = true;
          logger.info("PostgreSQL connected successfully");

          // Setup pool error handler
          this.pool.on("error", (err) => {
            logger.error("Unexpected error on idle client", err);
            this.isConnected = false;
          });

          return;
        } catch (error) {
          attempts++;
          logger.error(`Connection attempt ${attempts} failed:`, error);

          if (attempts === this.config.retryAttempts) {
            throw new AppError(
              ErrorCode.DATABASE_ERROR,
              "Failed to connect to database"
            );
          }

          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay)
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
    if (!this.isConnected || !this.pool) {
      return;
    }

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

// Export a function that ensures connection before returning the pool
export const getDatabasePool = async () => {
  await database.connect();
  return database.getPool();
};

// Export connectDB function for backward compatibility
export const connectDB = async (): Promise<void> => {
  await database.connect();
};

export { Database, DatabaseError };
