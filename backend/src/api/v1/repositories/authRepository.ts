import { PrismaClient, User, Prisma, Appointment } from "@prisma/client";
import { DateTime } from "luxon";

// Define a type for the Prisma transaction
export type PrismaTransaction = Prisma.TransactionClient;

export interface IAuthRepository {
  // User operations
  findUserByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } }) | null>;
  findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } }) | null>;
  createUser(
    data: {
      email: string;
      password?: string;
      name: string;
      roleId: string;
      googleId?: string;
    },
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;
  updateUser(
    id: string,
    data: Partial<User>,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;
  deactivateUser(
    id: string,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }>;

  findActiveAppointments(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Appointment[]>;

  cancelAppointments(
    appointmentIds: string[],
    reason: string,
    tx?: PrismaTransaction
  ): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  async findUserByEmail(
    email: string,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } }) | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findUserById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(User & { role: { name: string } }) | null> {
    const client = this.getClient(tx);
    return client.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async createUser(
    data: {
      email: string;
      password?: string;
      name: string;
      roleId: string;
      googleId?: string;
    },
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.create({
      data,
      include: { role: true },
    });
  }

  async updateUser(
    id: string,
    data: Partial<User>,
    tx?: PrismaTransaction
  ): Promise<User & { role: { name: string } }> {
    const client = this.getClient(tx);
    return client.user.update({
      where: { id },
      data,
      include: { role: true },
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

  async findActiveAppointments(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Appointment[]> {
    const client = this.getClient(tx);
    return client.appointment.findMany({
      where: {
        OR: [{ userId }, { stylistId: userId }],
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancelAppointments(
    appointmentIds: string[],
    reason: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.appointment.updateMany({
      where: {
        id: { in: appointmentIds },
        status: { in: ["PENDING", "CONFIRMED"] }, // Extra safety check
      },
      data: {
        status: "CANCELLED",
        notes: reason,
      },
    });
  }
}
