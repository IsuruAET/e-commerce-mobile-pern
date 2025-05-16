import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

import { AppError } from "./errorHandler";
import { ErrorCode, ErrorType } from "constants/errorCodes";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        return next(
          new AppError(
            ErrorCode.VALIDATION_ERROR,
            undefined,
            true,
            errors,
            ErrorType.VALIDATION
          )
        );
      }
      return next(error);
    }
  };
};
