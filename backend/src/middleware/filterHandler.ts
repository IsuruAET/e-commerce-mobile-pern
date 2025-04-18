import { Request, Response, NextFunction } from "express";

// Extend Express Request type to include filters
declare global {
  namespace Express {
    interface Request {
      filters: Record<string, any>;
    }
  }
}

export const filterHandler = (allowedFilters: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const filters: Record<string, any> = {};

      // Process query parameters for filtering
      Object.keys(req.query).forEach((key) => {
        // Check if the filter key is allowed
        if (allowedFilters.includes(key)) {
          let value = req.query[key];

          // Handle array of values
          if (Array.isArray(value)) {
            filters[key] = value.map((v) => {
              if (typeof v === "string") {
                const lowerValue = v.toLowerCase();
                if (lowerValue === "true") return true;
                if (lowerValue === "false") return false;
              }
              return v;
            });
          }
          // Handle single value
          else if (typeof value === "string") {
            const lowerValue = value.toLowerCase();
            if (lowerValue === "true") filters[key] = true;
            else if (lowerValue === "false") filters[key] = false;
            else filters[key] = value;
          } else {
            filters[key] = value;
          }
        }
      });

      // Attach filters to request object
      req.filters = filters;
      next();
    } catch (error) {
      next(error);
    }
  };
};
