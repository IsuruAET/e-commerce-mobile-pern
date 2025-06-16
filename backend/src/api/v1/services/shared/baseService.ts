import { PrismaClient, Prisma } from "@prisma/client";

import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

export class BaseService {
  protected readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  protected async handleNotFound<T>(
    operation: () => Promise<T | null>,
    errorCode: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND
  ): Promise<T> {
    const result = await operation();
    if (!result) {
      throw new AppError(errorCode);
    }
    return result;
  }

  protected async handleTransaction<T>(
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
    options?: {
      timeout?: number;
      maxRetries?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
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
  }
}
