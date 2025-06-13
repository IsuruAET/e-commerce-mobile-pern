import { Request, Response, NextFunction } from "express";

interface CustomRequest extends Request {
  id: string;
}

import {
  ErrorCode,
  ERROR_MESSAGES,
  ERROR_STATUS_CODES,
  ErrorType,
} from "constants/errorCodes";
import {
  createErrorResponse,
  createValidationErrorResponse,
} from "utils/responseUtils";

export class AppError extends Error {
  constructor(
    public errorCode: ErrorCode,
    public message: string = ERROR_MESSAGES[errorCode],
    public isOperational: boolean = true,
    public errors?: any[],
    public type?: ErrorType
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  get statusCode(): number {
    return ERROR_STATUS_CODES[this.errorCode];
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: CustomRequest,
  res: Response,
  _next: NextFunction
) => {
  res.setHeader("Content-Type", "application/json");

  // Check if route exists
  if (req.path.startsWith("/api/v1/") && !req.route) {
    const response = createErrorResponse(
      req,
      ErrorCode.RESOURCE_NOT_FOUND,
      "API endpoint not found"
    );
    return res.status(404).json(response);
  }

  // Handle AppError
  if (err instanceof AppError) {
    // Handle validation errors
    if (err.errorCode === ErrorCode.VALIDATION_ERROR && err.errors) {
      const fields = err.errors.reduce((acc, error) => {
        const field = error.path;
        if (!acc[field]) {
          acc[field] = [];
        }
        acc[field].push(error.message);
        return acc;
      }, {} as Record<string, string[]>);

      const response = createValidationErrorResponse(req, fields);
      return res.status(err.statusCode).json(response);
    }

    // Handle other AppErrors
    const response = createErrorResponse(
      req,
      err.errorCode,
      err.message,
      err.errors ? { details: err.errors } : undefined
    );
    return res.status(err.statusCode).json(response);
  }

  // Handle other errors
  const response = createErrorResponse(
    req,
    ErrorCode.INTERNAL_SERVER_ERROR,
    ERROR_MESSAGES[ErrorCode.INTERNAL_SERVER_ERROR]
  );

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.error.details = { stack: err.stack };
  }

  return res
    .status(ERROR_STATUS_CODES[ErrorCode.INTERNAL_SERVER_ERROR])
    .json(response);
};
