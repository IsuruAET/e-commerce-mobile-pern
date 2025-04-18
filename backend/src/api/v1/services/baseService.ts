import { PrismaClient, Prisma } from "@prisma/client";

import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

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

  protected static async handleTransaction<T>(
    operations: (
      tx: Omit<
        PrismaClient,
        | "$connect"
        | "$disconnect"
        | "$on"
        | "$transaction"
        | "$use"
        | "$extends"
      >
    ) => Promise<T>,
    _errorCode: ErrorCode = ErrorCode.DATABASE_ERROR,
    options?: {
      timeout?: number;
      maxRetries?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    return await this.handleDatabaseError(async () => {
      return await this.prisma.$transaction(
        async (tx) => {
          return await operations(tx);
        },
        {
          timeout: options?.timeout || 5000,
          maxWait: options?.timeout || 7000,
          isolationLevel: options?.isolationLevel || "Serializable",
        }
      );
    });
  }

  protected static async handleWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    return await Promise.race<T>([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new AppError(ErrorCode.OPERATION_TIMEOUT)),
          timeoutMs
        )
      ),
    ]);
  }
}
