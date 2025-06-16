import { PrismaClient, Role, Permission } from "@prisma/client";

// Define a type for the Prisma transaction
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface IRoleRepository {
  // Role operations
  findRoleById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(Role & { permissions: { permission: Permission }[] }) | null>;
  findRoleByName(
    name: string,
    tx?: PrismaTransaction
  ): Promise<(Role & { permissions: { permission: Permission }[] }) | null>;
  createRole(
    data: {
      name: string;
      description: string;
      permissions: string[];
    },
    tx?: PrismaTransaction
  ): Promise<Role & { permissions: { permission: Permission }[] }>;
  updateRole(
    id: string,
    data: {
      name: string;
      description: string;
      permissions: string[];
    },
    tx?: PrismaTransaction
  ): Promise<Role & { permissions: { permission: Permission }[] }>;
  deleteRole(id: string, tx?: PrismaTransaction): Promise<void>;
  getAllRoles(
    tx?: PrismaTransaction
  ): Promise<(Role & { permissions: { permission: Permission }[] })[]>;
  getAllPermissions(tx?: PrismaTransaction): Promise<Permission[]>;
}

export class RoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  async findRoleById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(Role & { permissions: { permission: Permission }[] }) | null> {
    const client = this.getClient(tx);
    return client.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findRoleByName(
    name: string,
    tx?: PrismaTransaction
  ): Promise<(Role & { permissions: { permission: Permission }[] }) | null> {
    const client = this.getClient(tx);
    return client.role.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async createRole(
    data: {
      name: string;
      description: string;
      permissions: string[];
    },
    tx?: PrismaTransaction
  ): Promise<Role & { permissions: { permission: Permission }[] }> {
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
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async updateRole(
    id: string,
    data: {
      name: string;
      description: string;
      permissions: string[];
    },
    tx?: PrismaTransaction
  ): Promise<Role & { permissions: { permission: Permission }[] }> {
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
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async deleteRole(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = this.getClient(tx);
    await client.role.delete({
      where: { id },
    });
  }

  async getAllRoles(
    tx?: PrismaTransaction
  ): Promise<(Role & { permissions: { permission: Permission }[] })[]> {
    const client = this.getClient(tx);
    return client.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getAllPermissions(tx?: PrismaTransaction): Promise<Permission[]> {
    const client = this.getClient(tx);
    return client.permission.findMany();
  }
}
