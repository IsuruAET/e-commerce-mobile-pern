import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/database";
import { connectRedis } from "./config/redis";
import { requestLogger, logger } from "./middleware/logger";
import v1Routes from "./api/v1/index";
import { errorHandler } from "middleware/errorHandler";
import { databaseErrorHandler } from "middleware/databaseErrorHandler";
import { requestIdMiddleware } from "middleware/requestId";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import "./config/passport";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS
const corsOptions = {
  origin: process.env.APP_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};

// Middleware
app.use(requestIdMiddleware); // First for request tracking
app.use(requestLogger); // Log all requests
app.use(cors(corsOptions)); // Security boundary
app.use(express.json()); // Parse request bodies
app.use(cookieParser()); // Parse cookies

// API routes - handle auth per route instead of globally
app.use("/api/v1", v1Routes);

// Let Express handle 404s naturally
app.use("*", (req, res, next) => {
  next(new AppError(ErrorCode.RESOURCE_NOT_FOUND));
});

// Error handling middleware (always last)
app.use(databaseErrorHandler); // Add database error handler before general error handler
app.use(errorHandler);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the E-commerce API!",
    documentation: "Please refer to /api/v1 for API endpoints",
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Connect to PostgreSQL and Redis, then start server
const startServer = async () => {
  try {
    // Connect to both PostgreSQL and Redis concurrently
    await Promise.all([connectDB(), connectRedis()]);

    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`API v1 available at: http://localhost:${port}/api/v1`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
