import { PrismaClient, User, Prisma } from "@prisma/client";
import { DateTime } from "luxon";

// Define a type for the Prisma transaction
export type PrismaTransaction = Prisma.TransactionClient;

// Base types
export type UserResponse = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isDeactivated: boolean;
  deactivatedAt: Date | null;
  createdAt: Date;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
};

export type UserCreateData = {
  email: string;
  name: string;
  phone?: string;
  roleId: string;
};

export type UserUpdateData = {
  email?: string;
  name?: string;
  phone?: string;
  roleId?: string;
};

// Core CRUD operations
export interface IUserCRUD {
  createUser(
    data: UserCreateData,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;

  findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<UserResponse | null>;

  updateUser(
    id: string,
    data: UserUpdateData,
    tx?: PrismaTransaction
  ): Promise<UserResponse>;

  deleteUser(id: string, tx?: PrismaTransaction): Promise<void>;
}

// Query operations
export interface IUserQuery {
  findUserByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<UserResponse | null>;

  findUsers(
    filters: any,
    pagination: { skip: number; take: number },
    orderBy: any,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } })[]>;

  countUsers(filters: any, tx?: PrismaTransaction): Promise<number>;
}

// Management operations
export interface IUserManagement {
  deactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;

  reactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;

  countUsersWithRole(roleId: string, tx?: PrismaTransaction): Promise<number>;
}

// Combined interface for the main repository
export interface IUserRepository
  extends IUserCRUD,
    IUserQuery,
    IUserManagement {}

// Base repository with common functionality
export abstract class BaseUserRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  protected getDefaultSelect() {
    return {
      id: true,
      email: true,
      name: true,
      phone: true,
      isDeactivated: true,
      deactivatedAt: true,
      createdAt: true,
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    };
  }
}

// CRUD operations repository
export class UserCRUDRepository
  extends BaseUserRepository
  implements IUserCRUD
{
  async createUser(
    data: UserCreateData,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.create({
      data,
      include: { role: true },
    });
  }

  async findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<UserResponse | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { id },
      select: this.getDefaultSelect(),
    });
  }

  async updateUser(
    id: string,
    data: UserUpdateData,
    tx?: PrismaTransaction
  ): Promise<UserResponse> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data,
      select: this.getDefaultSelect(),
    });
  }

  async deleteUser(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = this.getClient(tx);
    await client.user.delete({
      where: { id },
    });
  }
}

// Query operations repository
export class UserQueryRepository
  extends BaseUserRepository
  implements IUserQuery
{
  async findUserByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<UserResponse | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { email },
      select: this.getDefaultSelect(),
    });
  }

  async findUsers(
    filters: any,
    pagination: { skip: number; take: number },
    orderBy: any,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } })[]> {
    const client = this.getClient(tx);
    return client.user.findMany({
      where: filters,
      include: { role: true },
      skip: pagination.skip,
      take: pagination.take,
      orderBy,
    });
  }

  async countUsers(filters: any, tx?: PrismaTransaction): Promise<number> {
    const client = this.getClient(tx);
    return client.user.count({ where: filters });
  }
}

// Management repository
export class UserManagementRepository
  extends BaseUserRepository
  implements IUserManagement
{
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

  async reactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data: {
        isDeactivated: false,
        deactivatedAt: null,
      },
      include: { role: true },
    });
  }

  async countUsersWithRole(
    roleId: string,
    tx?: PrismaTransaction
  ): Promise<number> {
    const client = this.getClient(tx);
    return client.user.count({
      where: { roleId },
    });
  }
}

// Main repository that combines all functionality
export class UserRepository implements IUserRepository {
  private crud: UserCRUDRepository;
  private query: UserQueryRepository;
  private management: UserManagementRepository;

  constructor(prisma: PrismaClient) {
    this.crud = new UserCRUDRepository(prisma);
    this.query = new UserQueryRepository(prisma);
    this.management = new UserManagementRepository(prisma);
  }

  // Delegate all methods to appropriate repositories
  createUser = (data: UserCreateData, tx?: PrismaTransaction) =>
    this.crud.createUser(data, tx);

  findUserById = (id: string, tx?: PrismaTransaction) =>
    this.crud.findUserById(id, tx);

  updateUser = (id: string, data: UserUpdateData, tx?: PrismaTransaction) =>
    this.crud.updateUser(id, data, tx);

  deleteUser = (id: string, tx?: PrismaTransaction) =>
    this.crud.deleteUser(id, tx);

  findUserByEmail = (email: string, tx?: PrismaTransaction) =>
    this.query.findUserByEmail(email, tx);

  findUsers = (
    filters: any,
    pagination: { skip: number; take: number },
    orderBy: any,
    tx?: PrismaTransaction
  ) => this.query.findUsers(filters, pagination, orderBy, tx);

  countUsers = (filters: any, tx?: PrismaTransaction) =>
    this.query.countUsers(filters, tx);

  deactivateUser = (id: string, tx?: PrismaTransaction) =>
    this.management.deactivateUser(id, tx);

  reactivateUser = (id: string, tx?: PrismaTransaction) =>
    this.management.reactivateUser(id, tx);

  countUsersWithRole = (roleId: string, tx?: PrismaTransaction) =>
    this.management.countUsersWithRole(roleId, tx);
}
