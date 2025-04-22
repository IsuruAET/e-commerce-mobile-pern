import { expressjwt } from "express-jwt";
import { Request, Response, NextFunction } from "express";

import { AppError } from "./errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { PUBLIC_ROUTES } from "constants/publicRoutes";

// Extend Express Request type to include auth property
export interface AuthRequest<P = {}, ResBody = {}, ReqBody = {}, ReqQuery = {}>
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  auth?: {
    userId: string;
    email: string;
    role: string;
    isDeactivated: boolean;
  };
}

// JWT middleware for protecting routes
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip authentication for specific auth routes
  if (PUBLIC_ROUTES.includes(req.path)) {
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
        return next(new AppError(ErrorCode.UNAUTHORIZED));
      }
      return next(new AppError(ErrorCode.AUTHENTICATION_FAILED));
    }

    // Check deactivation status from JWT token
    const auth = (req as AuthRequest).auth;
    if (auth?.isDeactivated) {
      return next(new AppError(ErrorCode.ACCOUNT_DEACTIVATED));
    }

    next();
  });
};

// Middleware to check if user has required role
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw new AppError(ErrorCode.UNAUTHORIZED);
    }

    const userRole = req.auth.role;
    if (!roles.includes(userRole)) {
      throw new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS);
    }

    next();
  };
};
