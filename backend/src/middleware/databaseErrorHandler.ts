import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "./errorHandler";
import { ErrorCode } from "constants/errorCodes";

export const databaseErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only handle Prisma errors that weren't already converted to AppError
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = new AppError(
      (() => {
        switch (err.code) {
          case "P2002":
            return ErrorCode.UNIQUE_CONSTRAINT_VIOLATION;
          case "P2025":
            return ErrorCode.RESOURCE_NOT_FOUND;
          case "P2003":
            return ErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION;
          default:
            return ErrorCode.DATABASE_ERROR;
        }
      })()
    );
    return next(appError);
  }

  // Handle other Prisma errors
  if (
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientValidationError
  ) {
    return next(new AppError(ErrorCode.DATABASE_ERROR));
  }

  next(err);
};
