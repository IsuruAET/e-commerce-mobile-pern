import { Request, Response, NextFunction } from "express";

import { AppError } from "./errorHandler";
import { ErrorCode } from "constants/errorCodes";

export const paginationHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1) {
      throw new AppError(ErrorCode.INVALID_INPUT);
    }
    if (limit < 1 || limit > 100) {
      throw new AppError(ErrorCode.INVALID_INPUT);
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Add pagination info to request object
    req.pagination = {
      page,
      limit,
      skip,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Helper method to format pagination response
export const formatPaginationResponse = (req: Request, total: number) => {
  const { page, limit } = req.pagination;
  return {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: limit,
  };
};

// Extend Express Request type to include pagination
declare global {
  namespace Express {
    interface Request {
      pagination: {
        page: number;
        limit: number;
        skip: number;
      };
    }
  }
}
