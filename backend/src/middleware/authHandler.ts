import { expressjwt } from "express-jwt";
import { Request, Response, NextFunction } from "express";

import { AppError } from "./errorHandler";

// Extend Express Request type to include auth property
export interface AuthRequest<P = {}, ResBody = {}, ReqBody = {}, ReqQuery = {}>
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  auth?: {
    userId: string;
    email: string;
    role: string;
  };
}

// JWT middleware for protecting routes
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip authentication for specific auth routes
  const publicAuthRoutes = [
    "/auth/register",
    "/auth/login",
    "/auth/google",
    "/auth/google/callback",
    "/auth/refresh-token",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];

  if (publicAuthRoutes.includes(req.path)) {
    return next();
  }

  expressjwt({
    secret: process.env.JWT_ACCESS_SECRET!,
    algorithms: ["HS256"],
    requestProperty: "auth",
    credentialsRequired: true,
  })(req, res, (err) => {
    if (err) {
      if (err.name === "UnauthorizedError") {
        return next(
          new AppError(401, "Unauthorized - Invalid or expired token")
        );
      }
      return next(new AppError(500, "Authentication error"));
    }
    next();
  });
};

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
