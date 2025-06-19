import { PrismaClient, User, Prisma } from "@prisma/client";
import { DateTime } from "luxon";

// Define a type for the Prisma transaction
export type PrismaTransaction = Prisma.TransactionClient;

// Base types
export type UserWithRole = User & { role: { name: string } };

export type UserCreateData = {
  email: string;
  password?: string;
  name: string;
  roleId: string;
  googleId?: string;
};

// Core CRUD operations
export interface IAuthCRUD {
  findUserByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<UserWithRole | null>;
  findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<UserWithRole | null>;
  createUser(
    data: UserCreateData,
    tx?: PrismaTransaction
  ): Promise<UserWithRole>;
  updateUser(
    id: string,
    data: Partial<User>,
    tx?: PrismaTransaction
  ): Promise<UserWithRole>;
}

// Management operations
export interface IAuthManagement {
  deactivateUser(id: string, tx?: PrismaTransaction): Promise<UserWithRole>;
}

// Combined interface for the main repository
export interface IAuthRepository extends IAuthCRUD, IAuthManagement {}

// Base repository with common functionality
export abstract class BaseAuthRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  protected getDefaultInclude() {
    return {
      role: true,
    };
  }
}

// CRUD operations repository
export class AuthCRUDRepository
  extends BaseAuthRepository
  implements IAuthCRUD
{
  async findUserByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<UserWithRole | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { email },
      include: this.getDefaultInclude(),
    });
  }

  async findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<UserWithRole | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { id },
      include: this.getDefaultInclude(),
    });
  }

  async createUser(
    data: UserCreateData,
    tx?: PrismaTransaction
  ): Promise<UserWithRole> {
    const client = this.getClient(tx);
    return client.user.create({
      data,
      include: this.getDefaultInclude(),
    });
  }

  async updateUser(
    id: string,
    data: Partial<User>,
    tx?: PrismaTransaction
  ): Promise<UserWithRole> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data,
      include: this.getDefaultInclude(),
    });
  }
}

// Management repository
export class AuthManagementRepository
  extends BaseAuthRepository
  implements IAuthManagement
{
  async deactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<UserWithRole> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data: {
        isDeactivated: true,
        deactivatedAt: DateTime.now().toJSDate(),
      },
      include: this.getDefaultInclude(),
    });
  }
}

// Main repository that combines all functionality
export class AuthRepository implements IAuthRepository {
  private crud: AuthCRUDRepository;
  private management: AuthManagementRepository;

  constructor(prisma: PrismaClient) {
    this.crud = new AuthCRUDRepository(prisma);
    this.management = new AuthManagementRepository(prisma);
  }

  // Delegate all methods to appropriate repositories
  findUserByEmail = (email: string, tx?: PrismaTransaction) =>
    this.crud.findUserByEmail(email, tx);

  findUserById = (id: string, tx?: PrismaTransaction) =>
    this.crud.findUserById(id, tx);

  createUser = (data: UserCreateData, tx?: PrismaTransaction) =>
    this.crud.createUser(data, tx);

  updateUser = (id: string, data: Partial<User>, tx?: PrismaTransaction) =>
    this.crud.updateUser(id, data, tx);

  deactivateUser = (id: string, tx?: PrismaTransaction) =>
    this.management.deactivateUser(id, tx);
}
