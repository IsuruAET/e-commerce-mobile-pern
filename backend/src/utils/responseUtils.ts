import { DateTime } from "luxon";
import { Request } from "express";

export interface CustomRequest extends Request {
  id: string;
}

interface SuccessResponse<T = any> {
  success: true;
  data: T | null;
  message?: string;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ErrorResponse {
  success: false;
  data: null;
  message: string;
  error: {
    code: string;
    details?: {
      fields?: Record<string, string[]>;
      [key: string]: any;
    };
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export const createSuccessResponse = <T>(
  req: CustomRequest,
  data: T | null = null,
  message?: string
): SuccessResponse<T> => ({
  success: true,
  data,
  ...(message && { message }),
  meta: {
    timestamp: DateTime.now().toISO(),
    requestId: req.id,
  },
});

export const createErrorResponse = (
  req: CustomRequest,
  code: string,
  message: string,
  details?: Record<string, any>
): ErrorResponse => ({
  success: false,
  data: null,
  message,
  error: {
    code,
    ...(details && { details }),
  },
  meta: {
    timestamp: DateTime.now().toISO(),
    requestId: req.id,
  },
});

export const createValidationErrorResponse = (
  req: CustomRequest,
  fields: Record<string, string[]>
): ErrorResponse => ({
  success: false,
  data: null,
  message: "Validation failed",
  error: {
    code: "VALIDATION_ERROR",
    details: {
      fields,
    },
  },
  meta: {
    timestamp: DateTime.now().toISO(),
    requestId: req.id,
  },
});
