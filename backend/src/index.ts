import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/database";
import { setupLogging } from "./config/logger";
import v1Routes from "./api/v1/index";
import { AuthService } from "./api/v1/services/authService";
import { errorHandler } from "middleware/errorHandler";
import { requireAuth } from "middleware/authHandler";
import { requestIdMiddleware } from "middleware/requestId";
import "./config/passport";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(requestIdMiddleware);

// Setup logging middleware
setupLogging().forEach((middleware) => app.use(middleware));

// API Routes
app.use("/api/v1", requireAuth, v1Routes);

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
      console.log(`Server is running on port ${port}`);
      console.log(`API v1 available at: http://localhost:${port}/api/v1`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
