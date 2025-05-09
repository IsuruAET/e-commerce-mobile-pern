import { expressjwt } from "express-jwt";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

import { AppError } from "./errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { PUBLIC_ROUTES } from "constants/publicRoutes";

const prisma = new PrismaClient();

// Extend Express Request type to include auth property
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: string;
        isDeactivated: boolean;
      };
    }
  }
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
    if (req.auth?.isDeactivated) {
      return next(new AppError(ErrorCode.ACCOUNT_DEACTIVATED));
    }

    next();
  });
};

// Middleware to check if user has required permission
export const requirePermission = (permissions: string[]): RequestHandler => {
  return async (req, res, next) => {
    if (!req.auth) {
      throw new AppError(ErrorCode.UNAUTHORIZED);
    }

    try {
      // Get user's role and its permissions
      const userRole = await prisma.role.findFirst({
        where: { name: req.auth.role },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!userRole) {
        throw new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS);
      }

      // Check if user has any of the required permissions
      const hasPermission = userRole.permissions.some((rp) =>
        permissions.includes(rp.permission.name)
      );

      if (!hasPermission) {
        throw new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
