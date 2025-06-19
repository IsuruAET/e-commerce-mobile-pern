import { expressjwt } from "express-jwt";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { prismaClient } from "config/prisma";

import { AppError } from "./errorHandler";
import { ErrorCode } from "constants/errorCodes";

// JWT middleware for protecting routes
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      const userRole = await prismaClient.role.findFirst({
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
      const hasPermission = userRole.permissions.some(
        (rp: { permission: { name: string } }) =>
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
