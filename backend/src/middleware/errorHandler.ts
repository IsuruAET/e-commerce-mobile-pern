import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public errors?: any[]
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface ErrorResponse {
  status: "error";
  message: string;
  code: number;
  errors?: any[];
  stack?: string;
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set response headers to ensure JSON response
  res.setHeader("Content-Type", "application/json");

  const response: ErrorResponse = {
    status: "error",
    message: err.message || "Internal server error",
    code: err instanceof AppError ? err.statusCode : 500,
    ...(err instanceof AppError && err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  // Send JSON response
  return res.status(response.code).json(response);
};
