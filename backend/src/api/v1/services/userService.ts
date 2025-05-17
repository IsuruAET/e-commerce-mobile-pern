import { CreateUserInput, UpdateUserInput } from "../schemas/userSchema";
import { BaseService } from "./shared/baseService";
import { PasswordService } from "./shared/passwordService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import {
  buildQueryOptions,
  buildPagination,
  PaginatedResponse,
} from "utils/queryBuilder";
import { UserRepository } from "../repositories/userRepository";

export class UserService extends BaseService {
  private static userRepository = new UserRepository(BaseService.prisma);

  static async createUser(data: CreateUserInput) {
    return await this.handleDatabaseError(async () => {
      const user = await this.userRepository.createUser({
        email: data.email,
        name: data.name,
        phone: data.phone,
        roleId: data.roleId,
      });

      // Generate and send password creation token
      await PasswordService.generateAndSendPasswordCreationToken(
        user.id,
        user.email
      );

      return user;
    });
  }

  static async getUserById(id: string) {
    return await this.handleNotFound(async () => {
      return await this.userRepository.findUserById(id);
    });
  }

  static async listUsers(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(
        queryParams,
        {
          roleIds: { type: "array", field: "roleId" },
          isDeactivated: { type: "boolean" },
        },
        ["email", "name"]
      );

      // Get the total count with the filters
      const total = await this.userRepository.countUsers(filters);

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const users = await this.userRepository.findUsers(
        filters,
        { skip: (page - 1) * count, take: count },
        orderBy
      );

      return {
        list: users,
        pagination,
      };
    });
  }

  static async updateUser(id: string, data: UpdateUserInput) {
    return await this.handleNotFound(async () => {
      const updateData: any = { ...data };

      return await this.userRepository.updateUser(id, {
        email: updateData.email,
        name: updateData.name,
        phone: updateData.phone,
        roleId: updateData.roleId,
      });
    });
  }

  static async deleteUser(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if user has any appointments as client or stylist
      const appointments = await this.userRepository.findUserAppointments(
        id,
        tx
      );

      if (appointments.length > 0) {
        throw new AppError(ErrorCode.USER_HAS_APPOINTMENTS);
      }

      // Delete all related tokens
      await this.userRepository.deleteUserTokens(id, tx);

      // Delete the user
      await this.userRepository.deleteUser(id, tx);
    });
  }

  static async deactivateUser(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Find all active appointments
      const activeAppointments = await this.userRepository.findUserAppointments(
        id,
        tx
      );

      // Update all active appointments to CANCELLED with a note
      if (activeAppointments.length > 0) {
        await tx.appointment.updateMany({
          where: {
            id: {
              in: activeAppointments.map((appointment) => appointment.id),
            },
          },
          data: {
            status: "CANCELLED",
            notes: "Appointment cancelled due to account deactivation",
          },
        });
      }

      // Delete all tokens
      await this.userRepository.deleteUserTokens(id, tx);

      // Deactivate the user
      await this.userRepository.deactivateUser(id, tx);
    });
  }

  static async reactivateUser(id: string) {
    return await this.handleDatabaseError(async () => {
      return await this.userRepository.reactivateUser(id);
    });
  }
}
