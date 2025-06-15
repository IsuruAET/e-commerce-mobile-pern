import { Request, Response, NextFunction } from "express";
import { ErrorCode } from "constants/errorCodes";
import { createErrorResponse } from "utils/responseUtils";

export const checkRouteExists = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only check API routes
  if (req.path.startsWith("/api/v1/") && !req.route) {
    const response = createErrorResponse(
      req,
      ErrorCode.RESOURCE_NOT_FOUND,
      "API endpoint not found"
    );
    return res.status(404).json(response);
  }
  next();
};
