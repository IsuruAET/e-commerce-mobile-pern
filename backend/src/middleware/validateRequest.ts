import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

import { AppError } from "./errorHandler";
import { ErrorCode, ErrorType } from "constants/errorCodes";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
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

    // Update request with validated data
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;

    return next();
  };
};
