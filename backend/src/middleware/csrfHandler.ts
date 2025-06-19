import { doubleCsrf } from "csrf-csrf";
import { Request, Response, NextFunction } from "express";
import { COOKIE_CONFIG } from "config/cookies";
import { CSRF_SECURITY } from "config/cookies";
import { AppError } from "./errorHandler";
import { ErrorCode } from "constants/errorCodes";

const csrfInstance = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET || "fallback-secret-change-in-production",
  getSessionIdentifier: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return (req.user as any)?.id || req.ip || "anonymous";
  },
  cookieName: COOKIE_CONFIG.CSRF.name,
  cookieOptions: {
    ...COOKIE_CONFIG.CSRF.options,
  },
  getCsrfTokenFromRequest: (req: Request) => {
    const header = req.headers[CSRF_SECURITY.HEADER_NAME.toLowerCase()];
    if (Array.isArray(header)) return header[0];
    return header;
  },
});

const rawCsrfProtection = csrfInstance.doubleCsrfProtection;
export const generateCsrfToken = csrfInstance.generateCsrfToken;

// Wrapper to handle CSRF errors properly
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rawCsrfProtection(req, res, (err) => {
    if (err) {
      // Convert CSRF errors to proper AppError with 403 status
      if (err.name === "ForbiddenError" && err.message.includes("csrf")) {
        return next(new AppError(ErrorCode.CSRF_TOKEN_INVALID));
      }
      // Handle other CSRF-related errors
      if (err.message.includes("csrf")) {
        return next(new AppError(ErrorCode.CSRF_TOKEN_MISSING));
      }
      // For any other unexpected CSRF errors
      return next(new AppError(ErrorCode.CSRF_TOKEN_INVALID));
    }
    next();
  });
};

// Conditional CSRF protection - skip for mobile API or specific routes
export const conditionalCsrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF for mobile API requests (you can customize this logic)
  const isMobileRequest =
    req.headers["user-agent"]?.includes("mobile") ||
    req.headers["x-client-type"] === "mobile" ||
    req.path.startsWith("/api/v1/mobile");

  if (isMobileRequest) {
    return next();
  }

  return csrfProtection(req, res, next);
};
