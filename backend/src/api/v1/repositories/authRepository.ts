import {
  PrismaClient,
  User,
  RefreshToken,
  PasswordResetToken,
  PasswordCreationToken,
} from "@prisma/client";
import { DateTime } from "luxon";

// Define a type for the Prisma transaction
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
>;

export interface IAuthRepository {
  // User operations
  findUserByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } }) | null>;
  findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } }) | null>;
  createUser(
    data: {
      email: string;
      password: string;
      name: string;
      roleId: string;
    },
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;
  updateUser(
    id: string,
    data: Partial<User>,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;
  deactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;

  // Token operations
  createRefreshToken(
    data: {
      token: string;
      userId: string;
      expiresAt: Date;
    },
    tx?: PrismaTransaction
  ): Promise<RefreshToken>;
  findRefreshToken(
    token: string,
    tx?: PrismaTransaction
  ): Promise<RefreshToken | null>;
  deleteRefreshToken(token: string, tx?: PrismaTransaction): Promise<void>;
  deleteExpiredRefreshTokens(
    userId?: string,
    tx?: PrismaTransaction
  ): Promise<void>;

  // Password reset operations
  createPasswordResetToken(
    data: {
      token: string;
      userId: string;
      expiresAt: Date;
    },
    tx?: PrismaTransaction
  ): Promise<PasswordResetToken>;
  findPasswordResetToken(
    token: string,
    tx?: PrismaTransaction
  ): Promise<PasswordResetToken | null>;
  deletePasswordResetTokens(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<void>;
  deleteExpiredPasswordResetTokens(tx?: PrismaTransaction): Promise<void>;

  // Password creation operations
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
}

export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  async findUserByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } }) | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } }) | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async createUser(
    data: {
      email: string;
      password: string;
      name: string;
      roleId: string;
    },
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.create({
      data,
      include: { role: true },
    });
  }

  async updateUser(
    id: string,
    data: Partial<User>,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async deactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data: {
        isDeactivated: true,
        deactivatedAt: DateTime.now().toJSDate(),
      },
      include: { role: true },
    });
  }

  async createRefreshToken(
    data: {
      token: string;
      userId: string;
      expiresAt: Date;
    },
    tx?: PrismaTransaction
  ): Promise<RefreshToken> {
    const client = this.getClient(tx);
    return client.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(
    token: string,
    tx?: PrismaTransaction
  ): Promise<RefreshToken | null> {
    const client = this.getClient(tx);
    return client.refreshToken.findFirst({
      where: {
        token,
        expiresAt: { gt: DateTime.now().toJSDate() },
      },
    });
  }

  async deleteRefreshToken(
    token: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteExpiredRefreshTokens(
    userId?: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    const whereClause = {
      expiresAt: { lt: DateTime.now().toJSDate() },
      ...(userId ? { userId } : {}),
    };

    await client.refreshToken.deleteMany({
      where: whereClause,
    });
  }

  async createPasswordResetToken(
    data: {
      token: string;
      userId: string;
      expiresAt: Date;
    },
    tx?: PrismaTransaction
  ): Promise<PasswordResetToken> {
    const client = this.getClient(tx);
    return client.passwordResetToken.create({
      data,
    });
  }

  async findPasswordResetToken(
    token: string,
    tx?: PrismaTransaction
  ): Promise<PasswordResetToken | null> {
    const client = this.getClient(tx);
    return client.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: DateTime.now().toJSDate() },
      },
    });
  }

  async deletePasswordResetTokens(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.passwordResetToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredPasswordResetTokens(
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: DateTime.now().toJSDate() },
      },
    });
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
}
