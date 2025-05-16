import { BaseService } from "./shared/baseService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { RoleRepository } from "../repositories/roleRepository";

export class RoleService extends BaseService {
  private static roleRepository = new RoleRepository(BaseService.prisma);

  static async createRole(input: {
    name: string;
    description: string;
    permissions: string[];
  }) {
    return await this.handleTransaction(async (tx) => {
      // Check if role already exists
      const existingRole = await this.roleRepository.findRoleByName(
        input.name,
        tx
      );

      if (existingRole) {
        throw new AppError(ErrorCode.ROLE_EXISTS);
      }

      // Create role with permissions
      return await this.roleRepository.createRole(input, tx);
    });
  }

  static async getRole(id: string) {
    return await this.handleNotFound(async () => {
      return this.roleRepository.findRoleById(id);
    });
  }

  static async updateRole(
    id: string,
    input: { name: string; description: string; permissions: string[] }
  ) {
    return await this.handleTransaction(async (tx) => {
      // Check if role exists
      const existingRole = await this.roleRepository.findRoleById(id, tx);

      if (!existingRole) {
        throw new AppError(ErrorCode.ROLE_NOT_FOUND);
      }

      // Check if new name conflicts with existing role
      if (input.name !== existingRole.name) {
        const nameConflict = await this.roleRepository.findRoleByName(
          input.name,
          tx
        );

        if (nameConflict) {
          throw new AppError(ErrorCode.ROLE_EXISTS);
        }
      }

      // Update role and its permissions
      return await this.roleRepository.updateRole(id, input, tx);
    });
  }

  static async deleteRole(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if role exists
      const role = await this.roleRepository.findRoleById(id, tx);

      if (!role) {
        throw new AppError(ErrorCode.ROLE_NOT_FOUND);
      }

      // Check if role is in use
      const usersWithRole = await this.roleRepository.countUsersWithRole(
        id,
        tx
      );

      if (usersWithRole > 0) {
        throw new AppError(ErrorCode.ROLE_IN_USE);
      }

      // Delete role and its permissions
      await this.roleRepository.deleteRole(id, tx);
    });
  }

  static async getAllRoles() {
    return await this.handleDatabaseError(async () => {
      return this.roleRepository.getAllRoles();
    });
  }

  static async getAllPermissions() {
    return await this.handleDatabaseError(async () => {
      return this.roleRepository.getAllPermissions();
    });
  }

  static async getRolesForDropdown() {
    return await this.handleDatabaseError(async () => {
      const roles = await this.roleRepository.getAllRoles();
      return roles.map((role) => ({
        id: role.id,
        name: role.name,
      }));
    });
  }
}
