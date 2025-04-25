import { Request } from "express";
import { DateTime } from "luxon";

import { CreateUserInput, UpdateUserInput } from "../schemas/userSchema";
import { formatPaginationResponse } from "middleware/paginationHandler";
import { PasswordUtils } from "utils/passwordUtils";
import { BaseService } from "./baseService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { sendEmail } from "utils/emailUtils";
import { JwtUtils } from "utils/jwtUtils";

export class UserService extends BaseService {
  static async generateAndSendPasswordCreationToken(
    userId: string,
    email: string
  ) {
    return await this.handleWithTimeout(async () => {
      return await this.handleTransaction(async (tx) => {
        // Check for recent token requests
        const recentAttempts = await tx.passwordCreationToken.count({
          where: {
            userId,
            createdAt: {
              gte: DateTime.now().minus({ days: 1 }).toJSDate(),
            },
          },
        });

        if (recentAttempts >= 3) {
          throw new AppError(ErrorCode.TOO_MANY_PASSWORD_ATTEMPTS);
        }

        // Generate token using JWT
        const token = JwtUtils.generatePasswordToken(userId, "24h");
        const expiresAt = DateTime.now().plus({ hours: 24 }).toJSDate();

        // Store the token
        await tx.passwordCreationToken.create({
          data: {
            token,
            userId,
            expiresAt, // 24 hours
          },
        });

        // Send welcome email with password creation link
        const createPasswordUrl = `${process.env.FRONTEND_URL}/create-password?token=${token}`;
        await sendEmail({
          to: email,
          subject: "Welcome to Our Platform - Create Your Password",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #333333; text-align: center; margin-bottom: 20px;">Welcome to Our Platform!</h1>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">Hello,</p>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">Your account has been created. To get started, please create your password using the link below.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${createPasswordUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Create Password</a>
              </div>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">This link will expire in 24 hours for security reasons.</p>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px; word-break: break-all;">${createPasswordUrl}</p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p style="color: #999999; font-size: 12px; text-align: center;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
        });
      });
    }, 15000);
  }

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
      await this.generateAndSendPasswordCreationToken(user.id, user.email);

      return user;
    });
  }

  static async createPassword(token: string, password: string) {
    return await this.handleTransaction(async (tx) => {
      if (!token) {
        throw new AppError(ErrorCode.TOKEN_NOT_FOUND);
      }

      const { userId } = JwtUtils.verifyPasswordToken(token);

      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError(ErrorCode.USER_NOT_FOUND);
      }

      // Check if user is deactivated
      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      const passwordToken = await tx.passwordCreationToken.findFirst({
        where: {
          token: token,
          userId: userId,
          expiresAt: { gt: DateTime.now().toJSDate() },
        },
      });

      if (!passwordToken) {
        throw new AppError(ErrorCode.INVALID_PASSWORD_CREATION_TOKEN);
      }

      const hashedPassword = await PasswordUtils.hashPassword(password);

      await Promise.all([
        tx.user.update({
          where: { id: passwordToken.userId },
          data: { password: hashedPassword },
        }),
        tx.passwordCreationToken.deleteMany({
          where: { userId: passwordToken.userId },
        }),
      ]);

      return { message: "Password created successfully" };
    });
  }

  static async requestNewPasswordCreationToken(email: string) {
    return await this.handleTransaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          message:
            "If an account exists with this email, you will receive a password creation link",
        };
      }

      // Check if user is deactivated
      if (user.isDeactivated) {
        throw new AppError(
          ErrorCode.ACCOUNT_DEACTIVATED,
          "Your account has been deactivated. Please contact support for assistance."
        );
      }

      // Check if user already has a password
      if (user.password) {
        throw new AppError(ErrorCode.PASSWORD_ALREADY_SET);
      }

      // Generate and send new token
      await this.generateAndSendPasswordCreationToken(user.id, email);

      return {
        message:
          "If an account exists with this email, you will receive a password creation link",
      };
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
