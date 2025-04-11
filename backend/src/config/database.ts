import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

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
  private connectionAttempts: number = 0;
  private readonly MAX_RETRIES: number = 3;
  private readonly RETRY_DELAY: number = 2000; // 2 seconds

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private getConfig(): DatabaseConfig {
    return {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "ecommerce",
      password: process.env.DB_PASSWORD || "postgres",
      port: parseInt(process.env.DB_PORT || "5432"),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  private async createDatabaseIfNotExists(): Promise<void> {
    const config = this.getConfig();
    const tempConfig: PoolConfig = {
      ...config,
      database: "postgres", // Connect to default postgres database
    };

    const tempPool = new Pool(tempConfig);
    const client = await tempPool.connect();

    try {
      const result = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [config.database]
      );

      if (result.rows.length === 0) {
        await client.query(`CREATE DATABASE ${config.database}`);
        console.log(`Database ${config.database} created successfully`);
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to create database: ${(error as Error).message}`,
        error as Error
      );
    } finally {
      client.release();
      await tempPool.end();
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("Using existing database connection");
      return;
    }

    while (this.connectionAttempts < this.MAX_RETRIES) {
      try {
        await this.createDatabaseIfNotExists();

        const config = this.getConfig();
        this.pool = new Pool(config);

        // Test the connection
        const client = await this.pool.connect();
        client.release();

        this.isConnected = true;
        this.connectionAttempts = 0;
        console.log("PostgreSQL connected successfully");

        this.setupEventHandlers();
        return;
      } catch (error) {
        this.connectionAttempts++;
        console.error(
          `Connection attempt ${this.connectionAttempts} failed:`,
          error
        );

        if (this.connectionAttempts === this.MAX_RETRIES) {
          throw new DatabaseError(
            "Failed to connect to database after maximum retries",
            error as Error
          );
        }

        await this.wait(this.RETRY_DELAY);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.pool) return;

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      this.isConnected = false;
    });

    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.isConnected = false;
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error while disconnecting:", error);
      throw new DatabaseError(
        "Failed to disconnect from database",
        error as Error
      );
    }
  }

  public getPool(): Pool {
    if (!this.pool) {
      throw new DatabaseError("Database not connected");
    }
    return this.pool;
  }
}

// Export a connection function that uses the singleton
const connectDB = async (): Promise<void> => {
  const database = Database.getInstance();
  await database.connect();
};

export { connectDB, Database, DatabaseError };
