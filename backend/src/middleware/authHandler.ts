import { expressjwt, Request as JWTRequest } from "express-jwt";
import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

// Extend Express Request type to include auth property
export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    email: string;
    role: string;
  };
}

// JWT middleware for protecting routes
export const requireAuth = expressjwt({
  secret: process.env.JWT_ACCESS_SECRET!,
  algorithms: ["HS256"],
  requestProperty: "auth", // The property to attach the decoded token to
  credentialsRequired: true, // If false, continue to next middleware if no token is provided
});

// Middleware to check if user has required role
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw new AppError(401, "Unauthorized - No token provided");
    }

    const userRole = req.auth.role;
    if (!roles.includes(userRole)) {
      throw new AppError(403, "Forbidden - Insufficient permissions");
    }

    next();
  };
};

// Optional auth middleware for routes that can be accessed with or without authentication
export const optionalAuth = expressjwt({
  secret: process.env.JWT_ACCESS_SECRET!,
  algorithms: ["HS256"],
  requestProperty: "auth",
  credentialsRequired: false,
});
