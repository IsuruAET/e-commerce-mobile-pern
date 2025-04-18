import { Request, Response, NextFunction } from "express";

import { AppError } from "./errorHandler";
import { ErrorCode } from "constants/errorCodes";

// Extend Express Request type to include sort options
declare global {
  namespace Express {
    interface Request {
      sortOptions: {
        field: string;
        order: "asc" | "desc";
      }[];
    }
  }
}

export const sortHandler = (
  allowedSortFields: string[],
  defaultSort: { field: string; order: "asc" | "desc" } = {
    field: "createdAt",
    order: "desc",
  }
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      let sortOptions: { field: string; order: "asc" | "desc" }[] = [];

      // Handle array-based sorting
      const sortByArray = req.query.sortBy as string | string[];
      const sortOrderArray = req.query.sortOrder as string | string[];

      if (Array.isArray(sortByArray) && Array.isArray(sortOrderArray)) {
        if (sortByArray.length !== sortOrderArray.length) {
          throw new AppError(ErrorCode.INVALID_INPUT);
        }

        for (let i = 0; i < sortByArray.length; i++) {
          const field = sortByArray[i];
          const order = sortOrderArray[i];

          if (
            allowedSortFields.includes(field) &&
            ["asc", "desc"].includes(order.toLowerCase())
          ) {
            sortOptions.push({
              field,
              order: order.toLowerCase() as "asc" | "desc",
            });
          }
        }
      } else if (
        typeof sortByArray === "string" &&
        typeof sortOrderArray === "string"
      ) {
        // Handle comma-separated strings
        const fields = sortByArray.split(",");
        const orders = sortOrderArray.split(",");

        if (fields.length !== orders.length) {
          throw new AppError(ErrorCode.INVALID_INPUT);
        }

        for (let i = 0; i < fields.length; i++) {
          const field = fields[i].trim();
          const order = orders[i].trim().toLowerCase();

          if (
            allowedSortFields.includes(field) &&
            ["asc", "desc"].includes(order)
          ) {
            sortOptions.push({
              field,
              order: order as "asc" | "desc",
            });
          }
        }
      }

      // If no valid sort options were found, use default
      if (sortOptions.length === 0) {
        sortOptions = [defaultSort];
      }

      // Attach sort options to request object
      req.sortOptions = sortOptions;
      next();
    } catch (error) {
      next(error);
    }
  };
};
