import { Request, Response, NextFunction } from "express";

// Extend Express Request type to include sort options
declare global {
  namespace Express {
    interface Request {
      sortOptions: {
        field: string;
        order: "asc" | "desc";
      };
    }
  }
}

// Error messages
const ERROR_MESSAGES = {
  INVALID_SORT: "Invalid sort parameter",
  UNAUTHORIZED_FIELD: "Unauthorized field access",
};

export const sortHandler = (
  allowedSortFields: string[],
  defaultSort: { field: string; order: "asc" | "desc" } = {
    field: "createdAt",
    order: "desc",
  }
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let sortOptions = {
        field: defaultSort.field,
        order: defaultSort.order,
      };

      // Handle sort field
      const sortBy = req.query.sortBy as string;
      if (sortBy && allowedSortFields.includes(sortBy)) {
        sortOptions.field = sortBy;
      }

      // Handle sort order
      const sortOrder = req.query.sortOrder as string;
      if (sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase())) {
        sortOptions.order = sortOrder.toLowerCase() as "asc" | "desc";
      }

      // Attach sort options to request object
      req.sortOptions = sortOptions;
      next();
    } catch (error) {
      next(error);
    }
  };
};
