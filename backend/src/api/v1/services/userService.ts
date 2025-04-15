import { Request } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

import { CreateUserInput, UpdateUserInput } from "../schemas/userSchema";
import { AppError } from "middleware/errorHandler";
import { formatPaginationResponse } from "middleware/paginationHandler";
import { PasswordUtils } from "utils/passwordUtils";

const prisma = new PrismaClient();

export class UserService {
  static async createUser(data: CreateUserInput) {
    try {
      // Hash the password using PasswordUtils
      const hashedPassword = await PasswordUtils.hashPassword(data.password);

      const user = await prisma.user.create({
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new AppError(409, "User with this email already exists");
        }
      }
      throw new AppError(500, "Failed to create user");
    }
  }

  static async getUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
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

      if (!user) {
        throw new AppError(404, "User not found");
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to retrieve user");
    }
  }

  static async listUsers(req: Request) {
    try {
      const { skip, limit } = req.pagination;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
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
        prisma.user.count(),
      ]);

      return {
        data: users,
        pagination: formatPaginationResponse(req, total),
      };
    } catch (error) {
      throw new AppError(500, "Failed to retrieve users");
    }
  }

  static async updateUser(id: string, data: UpdateUserInput) {
    try {
      // If password is being updated, hash it using PasswordUtils
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await PasswordUtils.hashPassword(data.password);
      }

      const user = await prisma.user.update({
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new AppError(404, "User not found");
        }
        if (error.code === "P2002") {
          throw new AppError(409, "User with this email already exists");
        }
      }
      throw new AppError(500, "Failed to update user");
    }
  }

  static async deleteUser(id: string) {
    try {
      // First delete all related refresh tokens and password reset tokens
      await prisma.$transaction([
        prisma.refreshToken.deleteMany({
          where: { userId: id },
        }),
        prisma.passwordResetToken.deleteMany({
          where: { userId: id },
        }),
        prisma.user.delete({
          where: { id },
        }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new AppError(404, "User not found");
        }
      }
      console.log(error);
      throw new AppError(500, "Failed to delete user");
    }
  }
}
