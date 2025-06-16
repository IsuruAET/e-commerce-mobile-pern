import { CreateUserInput, UpdateUserInput } from "../schemas/userSchema";
import { BaseService } from "./shared/baseService";
import { passwordEmailService } from "./shared/passwordEmailService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import {
  buildQueryOptions,
  buildPagination,
  PaginatedResponse,
} from "utils/queryBuilder";
import { UserRepository } from "../repositories/userRepository";
import { AppointmentRepository } from "../repositories/appointmentRepository";
import { redisTokenService } from "./shared/redisTokenService";
import { prismaClient } from "config/prisma";

export class UserService extends BaseService {
  private userRepository: UserRepository;
  private appointmentRepository: AppointmentRepository;

  constructor() {
    super(prismaClient);
    this.userRepository = new UserRepository(this.prisma);
    this.appointmentRepository = new AppointmentRepository(this.prisma);
  }

  async createUser(data: CreateUserInput) {
    const existingUser = await this.userRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new AppError(ErrorCode.ADMIN_ADDING_EXISTING_USER);
    }

    const user = await this.userRepository.createUser({
      email: data.email,
      name: data.name,
      phone: data.phone,
      roleId: data.roleId,
    });

    // Generate and send password creation token
    await passwordEmailService.generateAndSendPasswordCreationToken(
      user.id,
      user.email
    );

    return user;
  }

  async getUserById(id: string) {
    return await this.handleNotFound(async () => {
      return await this.userRepository.findUserById(id);
    });
  }

  async listUsers(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
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
  }

  async updateUser(id: string, data: UpdateUserInput) {
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

  async deleteUser(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if user has any appointments as client or stylist
      const appointments =
        await this.appointmentRepository.findUserAppointments(id, tx);

      if (appointments.length > 0) {
        throw new AppError(ErrorCode.USER_HAS_APPOINTMENTS);
      }

      // Delete all tokens from Redis
      await Promise.all([
        redisTokenService.deleteAllUserTokens("REFRESH", id),
        redisTokenService.deleteAllUserTokens("PASSWORD_RESET", id),
        redisTokenService.deleteAllUserTokens("PASSWORD_CREATION", id),
      ]);

      // Delete the user
      await this.userRepository.deleteUser(id, tx);
    });
  }

  async deactivateUser(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Find all active appointments
      const activeAppointments =
        await this.appointmentRepository.findUserAppointments(id, tx);

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

      // Delete all tokens from Redis
      await Promise.all([
        redisTokenService.deleteAllUserTokens("REFRESH", id),
        redisTokenService.deleteAllUserTokens("PASSWORD_RESET", id),
        redisTokenService.deleteAllUserTokens("PASSWORD_CREATION", id),
      ]);

      // Deactivate the user
      await this.userRepository.deactivateUser(id, tx);
    });
  }

  async reactivateUser(id: string) {
    return await this.userRepository.reactivateUser(id);
  }
}
