import { DateTime } from "luxon";

import { CreateUserInput, UpdateUserInput } from "../schemas/userSchema";
import { BaseService } from "./baseService";
import { PasswordService } from "./shared/passwordService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import {
  buildQueryOptions,
  buildPagination,
  PaginatedResponse,
} from "utils/queryBuilder";

export class UserService extends BaseService {
  static async createUser(data: CreateUserInput) {
    return await this.handleDatabaseError(async () => {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          roleId: data.roleId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
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
      return await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  static async listUsers(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(queryParams, {
        roleIds: { type: "array", field: "roleId" },
        isDeactivated: { type: "boolean" },
      });

      // Get the total count with the filters
      const total = await this.prisma.user.count({ where: filters });

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const users = await this.prisma.user.findMany({
        where: filters,
        include: {
          role: true,
        },
        skip: (page - 1) * count,
        take: count,
        orderBy,
      });

      return {
        data: users,
        pagination,
      };
    });
  }

  static async updateUser(id: string, data: UpdateUserInput) {
    return await this.handleNotFound(async () => {
      const updateData: any = { ...data };

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          email: updateData.email,
          name: updateData.name,
          phone: updateData.phone,
          role: {
            connect: { id: updateData.role },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    });
  }

  static async deleteUser(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if user has any appointments as client or stylist
      const appointments = await tx.appointment.findFirst({
        where: {
          OR: [{ userId: id }, { stylistId: id }],
        },
      });

      if (appointments) {
        throw new AppError(ErrorCode.USER_HAS_APPOINTMENTS);
      }

      // First delete all related refresh tokens and password reset tokens
      await tx.refreshToken.deleteMany({
        where: { userId: id },
      });

      await tx.passwordResetToken.deleteMany({
        where: { userId: id },
      });

      await tx.user.delete({
        where: { id },
      });
    });
  }

  static async deactivateUser(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Find all active appointments
      const activeAppointments = await tx.appointment.findMany({
        where: {
          OR: [{ userId: id }, { stylistId: id }],
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

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

      // Delete all refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId: id },
      });

      // Delete all password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: { userId: id },
      });

      // Soft delete the user
      await tx.user.update({
        where: { id },
        data: {
          isDeactivated: true,
          deactivatedAt: DateTime.now().toJSDate(),
        },
      });
    });
  }

  static async reactivateUser(id: string) {
    return await this.handleDatabaseError(async () => {
      // Reactivate the user by setting isDeactivated to false and clearing deactivatedAt
      await this.prisma.user.update({
        where: { id },
        data: {
          isDeactivated: false,
          deactivatedAt: null,
        },
      });
    });
  }
}
