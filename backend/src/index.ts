import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/database";
import { requestLogger, logger } from "./middleware/logger";
import v1Routes from "./api/v1/index";
import { AuthService } from "./api/v1/services/authService";
import { errorHandler } from "middleware/errorHandler";
import { requireAuth } from "middleware/authHandler";
import { requestIdMiddleware } from "middleware/requestId";
import { csrfProtection, setCsrfToken } from "middleware/csrfHandler";
import "./config/passport";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(requestIdMiddleware);
app.use(requestLogger);

// CSRF Protection
app.use(setCsrfToken); // Set CSRF token for all routes
app.use("/api/v1", csrfProtection, requireAuth, v1Routes); // Protect API routes with CSRF

// Error handling middleware
app.use(errorHandler);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the E-commerce API!",
    documentation: "Please refer to /api/v1 for API endpoints",
  });
});

// Connect to PostgreSQL and start server
const startServer = async () => {
  try {
    await connectDB();

    // Start the refresh token cleanup scheduler
    AuthService.startCleanupScheduler();

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
