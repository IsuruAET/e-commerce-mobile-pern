import { Request } from "express";

import { CreateUserInput, UpdateUserInput } from "../schemas/userSchema";
import { formatPaginationResponse } from "middleware/paginationHandler";
import { PasswordUtils } from "utils/passwordUtils";
import { BaseService } from "./baseService";

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
    return await this.handleDatabaseError(async () => {
      // First delete all related refresh tokens and password reset tokens
      await this.prisma.$transaction([
        this.prisma.refreshToken.deleteMany({
          where: { userId: id },
        }),
        this.prisma.passwordResetToken.deleteMany({
          where: { userId: id },
        }),
        this.prisma.user.delete({
          where: { id },
        }),
      ]);
    });
  }
}
