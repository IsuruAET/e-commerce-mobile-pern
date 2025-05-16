import { PrismaClient, PasswordCreationToken } from "@prisma/client";
import { DateTime } from "luxon";

// Define a type for the Prisma transaction
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface IPasswordRepository {
  // Password creation token operations
  createPasswordCreationToken(
    data: {
      token: string;
      userId: string;
      expiresAt: Date;
    },
    tx?: PrismaTransaction
  ): Promise<PasswordCreationToken>;

  findPasswordCreationToken(
    token: string,
    tx?: PrismaTransaction
  ): Promise<PasswordCreationToken | null>;

  deletePasswordCreationTokens(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<void>;

  countRecentPasswordCreationTokens(
    userId: string,
    since: Date,
    tx?: PrismaTransaction
  ): Promise<number>;
}

export class PasswordRepository implements IPasswordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  async createPasswordCreationToken(
    data: {
      token: string;
      userId: string;
      expiresAt: Date;
    },
    tx?: PrismaTransaction
  ): Promise<PasswordCreationToken> {
    const client = this.getClient(tx);
    return client.passwordCreationToken.create({
      data,
    });
  }

  async findPasswordCreationToken(
    token: string,
    tx?: PrismaTransaction
  ): Promise<PasswordCreationToken | null> {
    const client = this.getClient(tx);
    return client.passwordCreationToken.findFirst({
      where: {
        token,
        expiresAt: { gt: DateTime.now().toJSDate() },
      },
    });
  }

  async deletePasswordCreationTokens(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.passwordCreationToken.deleteMany({
      where: { userId },
    });
  }

  async countRecentPasswordCreationTokens(
    userId: string,
    since: Date,
    tx?: PrismaTransaction
  ): Promise<number> {
    const client = this.getClient(tx);
    return client.passwordCreationToken.count({
      where: {
        userId,
        createdAt: {
          gte: since,
        },
      },
    });
  }
}
