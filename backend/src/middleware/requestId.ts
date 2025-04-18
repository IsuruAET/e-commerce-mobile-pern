import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

// Extend Express Request type to include id
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate a new UUID for each request
  req.id = uuidv4();

  // Add the request ID to response headers
  res.setHeader("X-Request-ID", req.id);

  next();
};
