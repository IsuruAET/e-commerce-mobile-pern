import { PrismaClient, User, Appointment } from "@prisma/client";
import { DateTime } from "luxon";

// Define a type for the Prisma transaction
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type UserResponse = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isDeactivated: boolean;
  deactivatedAt: Date | null;
  createdAt: Date;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
};

export interface IUserRepository {
  // User operations
  createUser(
    data: {
      email: string;
      name: string;
      phone?: string;
      roleId: string;
    },
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;

  findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<UserResponse | null>;

  findUsers(
    filters: any,
    pagination: { skip: number; take: number },
    orderBy: any,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } })[]>;

  countUsers(filters: any, tx?: PrismaTransaction): Promise<number>;

  updateUser(
    id: string,
    data: {
      email?: string;
      name?: string;
      phone?: string;
      roleId?: string;
    },
    tx?: PrismaTransaction
  ): Promise<UserResponse>;

  deleteUser(id: string, tx?: PrismaTransaction): Promise<void>;

  deactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;

  reactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;

  // Related operations
  findUserAppointments(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Appointment[]>;

  deleteUserTokens(userId: string, tx?: PrismaTransaction): Promise<void>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  async createUser(
    data: {
      email: string;
      name: string;
      phone?: string;
      roleId: string;
    },
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.create({
      data,
      include: { role: true },
    });
  }

  async findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<UserResponse | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isDeactivated: true,
        deactivatedAt: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async findUsers(
    filters: any,
    pagination: { skip: number; take: number },
    orderBy: any,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } })[]> {
    const client = this.getClient(tx);
    return client.user.findMany({
      where: filters,
      include: { role: true },
      skip: pagination.skip,
      take: pagination.take,
      orderBy,
    });
  }

  async countUsers(filters: any, tx?: PrismaTransaction): Promise<number> {
    const client = this.getClient(tx);
    return client.user.count({ where: filters });
  }

  async updateUser(
    id: string,
    data: {
      email?: string;
      name?: string;
      phone?: string;
      roleId?: string;
    },
    tx?: PrismaTransaction
  ): Promise<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    isDeactivated: boolean;
    deactivatedAt: Date | null;
    createdAt: Date;
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isDeactivated: true,
        deactivatedAt: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async deleteUser(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = this.getClient(tx);
    await client.user.delete({
      where: { id },
    });
  }

  async deactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data: {
        isDeactivated: true,
        deactivatedAt: DateTime.now().toJSDate(),
      },
      include: { role: true },
    });
  }

  async reactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data: {
        isDeactivated: false,
        deactivatedAt: null,
      },
      include: { role: true },
    });
  }

  async findUserAppointments(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Appointment[]> {
    const client = this.getClient(tx);
    return client.appointment.findMany({
      where: {
        OR: [{ userId }, { stylistId: userId }],
      },
    });
  }

  async deleteUserTokens(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await Promise.all([
      client.refreshToken.deleteMany({
        where: { userId },
      }),
      client.passwordResetToken.deleteMany({
        where: { userId },
      }),
      client.passwordCreationToken.deleteMany({
        where: { userId },
      }),
    ]);
  }
}
