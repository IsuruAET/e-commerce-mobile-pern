import { Request, Response, NextFunction } from "express";
import { DateTime } from "luxon";

interface CustomRequest extends Request {
  id: string;
}

import {
  ErrorCode,
  ERROR_MESSAGES,
  ERROR_STATUS_CODES,
  ErrorType,
} from "constants/errorCodes";

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

interface ErrorResponse {
  status: string;
  code: ErrorCode;
  message: string;
  type?: ErrorType;
  requestId?: string;
  timestamp: string;
  errors?: any[];
  stack?: string;
}

export const errorHandler = (
  err: Error | AppError,
  req: CustomRequest,
  res: Response,
  _next: NextFunction
) => {
  res.setHeader("Content-Type", "application/json");

  const timestamp = DateTime.now().toISO();

  let response: ErrorResponse;

  // Handle AppError
  if (err instanceof AppError) {
    response = {
      status: "error",
      code: err.errorCode,
      message: err.message,
      type: err.type,
      requestId: req.id,
      timestamp,
      ...(err.errors && { errors: err.errors }),
    };
  }
  // Handle other errors
  else {
    response = {
      status: "error",
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES[ErrorCode.INTERNAL_SERVER_ERROR],
      type: ErrorType.INTERNAL,
      requestId: req.id,
      timestamp,
    };
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  // Log the error with request ID
  const errorLog = {
    requestId: req.id,
    timestamp,
    method: req.method,
    url: req.url,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err instanceof AppError && {
        code: err.errorCode,
        type: err.type,
        isOperational: err.isOperational,
      }),
    },
  };

  console.error(JSON.stringify(errorLog, null, 2));

  return res.status(ERROR_STATUS_CODES[response.code]).json(response);
};
