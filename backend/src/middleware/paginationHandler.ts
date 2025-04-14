import { Request, Response, NextFunction } from "express";

export const paginationHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1) {
      throw new Error("Page number must be greater than 0");
    }
    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
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
