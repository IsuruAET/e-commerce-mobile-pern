import { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "../../../constants/errorCodes";

export class BaseService {
  protected static prisma = new PrismaClient();

  protected static async handleDatabaseError<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case "P2002":
            throw new AppError(ErrorCode.UNIQUE_CONSTRAINT_VIOLATION);
          case "P2025":
            throw new AppError(ErrorCode.RESOURCE_NOT_FOUND);
          case "P2003":
            throw new AppError(ErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION);
          default:
            throw new AppError(ErrorCode.DATABASE_ERROR);
        }
      }
      throw new AppError(ErrorCode.DATABASE_ERROR);
    }
  }

  protected static async handleNotFound<T>(
    operation: () => Promise<T | null>,
    errorCode: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND
  ): Promise<T> {
    const result = await this.handleDatabaseError(operation);
    if (!result) {
      throw new AppError(errorCode);
    }
    return result;
  }
}
