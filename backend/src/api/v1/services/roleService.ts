import { BaseService } from "./shared/baseService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { RoleRepository } from "../repositories/roleRepository";
import { prismaClient } from "config/prisma";

export class RoleService extends BaseService {
  private readonly roleRepository: RoleRepository;

  constructor() {
    super(prismaClient);
    this.roleRepository = new RoleRepository(this.prisma);
  }

  async createRole(input: {
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

  async getRole(id: string) {
    return await this.handleNotFound(async () => {
      return this.roleRepository.findRoleById(id);
    });
  }

  async updateRole(
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

  async deleteRole(id: string) {
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

  async getAllRoles() {
    return this.roleRepository.getAllRoles();
  }

  async getAllPermissions() {
    return this.roleRepository.getAllPermissions();
  }

  async getRolesForDropdown() {
    const roles = await this.roleRepository.getAllRoles();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
    }));
  }
}
