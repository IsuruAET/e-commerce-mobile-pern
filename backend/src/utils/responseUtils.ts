import { DateTime } from "luxon";
import { Request } from "express";
import { SuccessResponse, ErrorResponse, ApiResponse } from "types/api";

// Extend Express Request type to include id and auth property
declare global {
  namespace Express {
    interface Request {
      id: string;
      auth?: {
        userId: string;
        email: string;
        role: string;
        isDeactivated: boolean;
      };
    }
  }
}

export { SuccessResponse, ErrorResponse, ApiResponse };

export const isSuccessResponse = <T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> => {
  return response.success === true;
};

export const createSuccessResponse = <T>(
  req: Request,
  data: T,
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
  req: Request,
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
  req: Request,
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
