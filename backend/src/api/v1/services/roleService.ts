import { BaseService } from "./baseService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

export class RoleService extends BaseService {
  static async createRole(input: {
    name: string;
    description: string;
    permissions: string[];
  }) {
    return await this.handleTransaction(async (tx) => {
      // Check if role already exists
      const existingRole = await tx.role.findUnique({
        where: { name: input.name },
      });

      if (existingRole) {
        throw new AppError(ErrorCode.ROLE_EXISTS);
      }

      // Create role with permissions
      return await tx.role.create({
        data: {
          name: input.name,
          description: input.description,
          permissions: {
            create: input.permissions.map((permissionId) => ({
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
    });
  }

  static async getRole(id: string) {
    return await this.handleNotFound(async () => {
      return this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  static async updateRole(
    id: string,
    input: { name: string; description: string; permissions: string[] }
  ) {
    return await this.handleTransaction(async (tx) => {
      // Check if role exists
      const existingRole = await tx.role.findUnique({
        where: { id },
      });

      if (!existingRole) {
        throw new AppError(ErrorCode.ROLE_NOT_FOUND);
      }

      // Check if new name conflicts with existing role
      if (input.name !== existingRole.name) {
        const nameConflict = await tx.role.findUnique({
          where: { name: input.name },
        });

        if (nameConflict) {
          throw new AppError(ErrorCode.ROLE_EXISTS);
        }
      }

      // Update role and its permissions
      return await tx.role.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          permissions: {
            deleteMany: {},
            create: input.permissions.map((permissionId) => ({
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
    });
  }

  static async deleteRole(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if role exists
      const role = await tx.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new AppError(ErrorCode.ROLE_NOT_FOUND);
      }

      // Check if role is in use
      const usersWithRole = await tx.user.count({
        where: { roleId: id },
      });

      if (usersWithRole > 0) {
        throw new AppError(ErrorCode.ROLE_IN_USE);
      }

      // Delete role and its permissions
      await tx.role.delete({
        where: { id },
      });
    });
  }

  static async getAllRoles() {
    return await this.handleDatabaseError(async () => {
      return this.prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  static async getAllPermissions() {
    return await this.handleDatabaseError(async () => {
      return this.prisma.permission.findMany();
    });
  }
}
