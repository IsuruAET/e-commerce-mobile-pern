import { PrismaClient, Role, Permission, Prisma } from "@prisma/client";

// Define a type for the Prisma transaction
export type PrismaTransaction = Prisma.TransactionClient;

// Base types
export type RoleWithPermissions = Role & {
  permissions: { permission: Permission }[];
};

export type RoleCreateData = {
  name: string;
  description: string;
  permissions: string[];
};

// Core CRUD operations
export interface IRoleCRUD {
  createRole(
    data: RoleCreateData,
    tx?: PrismaTransaction
  ): Promise<RoleWithPermissions>;
  findRoleById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<RoleWithPermissions | null>;
  findRoleByName(
    name: string,
    tx?: PrismaTransaction
  ): Promise<RoleWithPermissions | null>;
  updateRole(
    id: string,
    data: RoleCreateData,
    tx?: PrismaTransaction
  ): Promise<RoleWithPermissions>;
  deleteRole(id: string, tx?: PrismaTransaction): Promise<void>;
}

// Query operations
export interface IRoleQuery {
  getAllRoles(tx?: PrismaTransaction): Promise<RoleWithPermissions[]>;
  getAllPermissions(tx?: PrismaTransaction): Promise<Permission[]>;
}

// Combined interface for the main repository
export interface IRoleRepository extends IRoleCRUD, IRoleQuery {}

// Base repository with common functionality
export abstract class BaseRoleRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  protected getDefaultInclude() {
    return {
      permissions: {
        include: {
          permission: true,
        },
      },
    };
  }
}

// CRUD operations repository
export class RoleCRUDRepository
  extends BaseRoleRepository
  implements IRoleCRUD
{
  async createRole(
    data: RoleCreateData,
    tx?: PrismaTransaction
  ): Promise<RoleWithPermissions> {
    const client = this.getClient(tx);
    return client.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: {
          create: data.permissions.map((permissionId) => ({
            permission: {
              connect: { id: permissionId },
            },
          })),
        },
      },
      include: this.getDefaultInclude(),
    });
  }

  async findRoleById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<RoleWithPermissions | null> {
    const client = this.getClient(tx);
    return client.role.findUnique({
      where: { id },
      include: this.getDefaultInclude(),
    });
  }

  async findRoleByName(
    name: string,
    tx?: PrismaTransaction
  ): Promise<RoleWithPermissions | null> {
    const client = this.getClient(tx);
    return client.role.findUnique({
      where: { name },
      include: this.getDefaultInclude(),
    });
  }

  async updateRole(
    id: string,
    data: RoleCreateData,
    tx?: PrismaTransaction
  ): Promise<RoleWithPermissions> {
    const client = this.getClient(tx);
    return client.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: {
          deleteMany: {},
          create: data.permissions.map((permissionId) => ({
            permission: {
              connect: { id: permissionId },
            },
          })),
        },
      },
      include: this.getDefaultInclude(),
    });
  }

  async deleteRole(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = this.getClient(tx);
    await client.role.delete({
      where: { id },
    });
  }
}

// Query operations repository
export class RoleQueryRepository
  extends BaseRoleRepository
  implements IRoleQuery
{
  async getAllRoles(tx?: PrismaTransaction): Promise<RoleWithPermissions[]> {
    const client = this.getClient(tx);
    return client.role.findMany({
      include: this.getDefaultInclude(),
    });
  }

  async getAllPermissions(tx?: PrismaTransaction): Promise<Permission[]> {
    const client = this.getClient(tx);
    return client.permission.findMany();
  }
}

// Main repository that combines all functionality
export class RoleRepository implements IRoleRepository {
  private crud: RoleCRUDRepository;
  private query: RoleQueryRepository;

  constructor(prisma: PrismaClient) {
    this.crud = new RoleCRUDRepository(prisma);
    this.query = new RoleQueryRepository(prisma);
  }

  // Delegate all methods to appropriate repositories
  createRole = (data: RoleCreateData, tx?: PrismaTransaction) =>
    this.crud.createRole(data, tx);

  findRoleById = (id: string, tx?: PrismaTransaction) =>
    this.crud.findRoleById(id, tx);

  findRoleByName = (name: string, tx?: PrismaTransaction) =>
    this.crud.findRoleByName(name, tx);

  updateRole = (id: string, data: RoleCreateData, tx?: PrismaTransaction) =>
    this.crud.updateRole(id, data, tx);

  deleteRole = (id: string, tx?: PrismaTransaction) =>
    this.crud.deleteRole(id, tx);

  getAllRoles = (tx?: PrismaTransaction) => this.query.getAllRoles(tx);

  getAllPermissions = (tx?: PrismaTransaction) =>
    this.query.getAllPermissions(tx);
}
