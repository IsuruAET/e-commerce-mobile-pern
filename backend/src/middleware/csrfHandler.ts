import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { PUBLIC_ROUTES } from "constants/publicRoutes";
import { logger } from "middleware/logger";
import { COOKIE_CONFIG, CSRF_SECURITY } from "config/cookies";

// Generate a random token
const generateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// CSRF middleware
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF check for safe methods
  if (
    CSRF_SECURITY.SAFE_METHODS.includes(
      req.method as "GET" | "HEAD" | "OPTIONS"
    )
  ) {
    return next();
  }

  // Skip CSRF check for public auth routes
  if (PUBLIC_ROUTES.some((route) => req.path.endsWith(route))) {
    return next();
  }

  // Get tokens from cookies and header
  const cookieToken = req.cookies[COOKIE_CONFIG.CSRF.name];
  const headerToken = req.headers[CSRF_SECURITY.HEADER_NAME.toLowerCase()];

  // Validate tokens
  if (!cookieToken && !headerToken) {
    throw new AppError(ErrorCode.CSRF_TOKEN_MISSING);
  }

  if (!cookieToken) {
    throw new AppError(ErrorCode.CSRF_TOKEN_INVALID);
  }

  if (!headerToken) {
    throw new AppError(ErrorCode.CSRF_TOKEN_MISSING);
  }

  if (cookieToken !== headerToken) {
    throw new AppError(ErrorCode.CSRF_TOKEN_MISMATCH);
  }

  next();
};

// Middleware to set CSRF token cookie
export const setCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only set new token if one doesn't exist
    if (!req.cookies[COOKIE_CONFIG.CSRF.name]) {
      // Generate new token
      const token = generateToken();

      // Set HttpOnly cookie (secure token)
      res.cookie(COOKIE_CONFIG.CSRF.name, token, COOKIE_CONFIG.CSRF.options);

      // Set non-HttpOnly cookie (for JavaScript access)
      res.cookie(
        COOKIE_CONFIG.CSRF_JS.name,
        token,
        COOKIE_CONFIG.CSRF_JS.options
      );
    }

    next();
  } catch (error) {
    // Log the error for debugging
    logger.error("Error setting CSRF token:", error);
    throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
  }
};
