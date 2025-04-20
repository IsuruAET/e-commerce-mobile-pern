import { Request } from "express";
import { DateTime } from "luxon";

import { CreateUserInput, UpdateUserInput } from "../schemas/userSchema";
import { formatPaginationResponse } from "middleware/paginationHandler";
import { PasswordUtils } from "utils/passwordUtils";
import { BaseService } from "./baseService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode, ErrorType } from "constants/errorCodes";

export class UserService extends BaseService {
  static async createUser(data: CreateUserInput) {
    return await this.handleDatabaseError(async () => {
      // Hash the password using PasswordUtils
      const hashedPassword = await PasswordUtils.hashPassword(data.password);

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
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

  static async listUsers(req: Request) {
    return await this.handleDatabaseError(async () => {
      const { skip, limit } = req.pagination;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.user.count(),
      ]);

      return {
        data: users,
        pagination: formatPaginationResponse(req, total),
      };
    });
  }

  static async updateUser(id: string, data: UpdateUserInput) {
    return await this.handleNotFound(async () => {
      // If password is being updated, hash it using PasswordUtils
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await PasswordUtils.hashPassword(data.password);
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          email: updateData.email,
          password: updateData.password,
          name: updateData.name,
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

  static async softDeleteUser(id: string) {
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
            notes: "Appointment cancelled due to account deletion",
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
          isDeleted: true,
          deletedAt: DateTime.now().toJSDate(),
        },
      });
    });
  }
}
