import {
  PrismaClient,
  Appointment,
  AppointmentService,
  Prisma,
} from "@prisma/client";

// Define a type for the Prisma transaction
export type PrismaTransaction = Prisma.TransactionClient;

// Base types for appointment data
export type AppointmentWithRelations = Appointment & {
  services: (AppointmentService & { service: any })[];
  user: { id: string; name: string; email: string };
  stylist: { id: string; name: string; email: string };
};

export type AppointmentCreateData = {
  userId: string;
  stylistId: string;
  dateTime: Date;
  notes?: string;
  estimatedDuration: number;
  totalPrice: number;
  services: { serviceId: string; numberOfPeople: number }[];
};

// Core CRUD operations
export interface IAppointmentCRUD {
  createAppointment(
    data: AppointmentCreateData,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations>;
  findAppointmentById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations | null>;
  updateAppointment(
    id: string,
    data: any,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations>;
}

// Query operations
export interface IAppointmentQuery {
  listAppointments(
    where: any,
    skip: number,
    take: number,
    orderBy: any,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations[]>;

  countAppointments(where: any, tx?: PrismaTransaction): Promise<number>;
}

// Analytics operations
export interface IAppointmentAnalytics {
  getTotalIncome(
    where: any,
    tx?: PrismaTransaction
  ): Promise<{ _sum: { totalPrice: Prisma.Decimal | null } }>;
  getTotalServices(
    where: any,
    tx?: PrismaTransaction
  ): Promise<{ _sum: { numberOfPeople: number | null } }>;
}

// User-specific operations
export interface IAppointmentUserOperations {
  findUserAppointmentsWithFilters(
    userId: string,
    skip: number,
    take: number,
    orderBy: any,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<
    (Appointment & {
      services: (AppointmentService & { service: any })[];
      stylist: { id: string; name: string; email: string };
    })[]
  >;

  countUserAppointments(
    userId: string,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<number>;
  findUserAppointmentById(
    id: string,
    userId: string,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations | null>;
  findUserAppointments(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Appointment[]>;
  findActiveAppointments(
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Appointment[]>;
}

// Stylist-specific operations
export interface IAppointmentStylistOperations {
  findStylistAppointments(
    stylistId: string,
    skip: number,
    take: number,
    orderBy: any,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<
    (Appointment & {
      services: (AppointmentService & { service: any })[];
      user: { id: string; name: string; email: string };
    })[]
  >;

  countStylistAppointments(
    stylistId: string,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<number>;
  findStylistAppointmentById(
    id: string,
    stylistId: string,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations | null>;
}

// Management operations
export interface IAppointmentManagement {
  cancelAppointments(
    appointmentIds: string[],
    reason: string,
    tx?: PrismaTransaction
  ): Promise<void>;
}

// Combined interface for the main repository
export interface IAppointmentRepository
  extends IAppointmentCRUD,
    IAppointmentQuery,
    IAppointmentAnalytics,
    IAppointmentUserOperations,
    IAppointmentStylistOperations,
    IAppointmentManagement {}

// Base repository with common functionality
export abstract class BaseAppointmentRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  protected getDefaultInclude() {
    return {
      services: {
        include: {
          service: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      stylist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };
  }
}

// CRUD operations repository
export class AppointmentCRUDRepository
  extends BaseAppointmentRepository
  implements IAppointmentCRUD
{
  async createAppointment(
    data: AppointmentCreateData,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations> {
    const client = this.getClient(tx);
    return client.appointment.create({
      data: {
        userId: data.userId,
        stylistId: data.stylistId,
        dateTime: data.dateTime,
        notes: data.notes,
        estimatedDuration: data.estimatedDuration,
        totalPrice: data.totalPrice,
        services: {
          create: data.services,
        },
      },
      include: this.getDefaultInclude(),
    });
  }

  async findAppointmentById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations | null> {
    const client = this.getClient(tx);
    return client.appointment.findUnique({
      where: { id },
      include: this.getDefaultInclude(),
    });
  }

  async updateAppointment(
    id: string,
    data: any,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations> {
    const client = this.getClient(tx);
    return client.appointment.update({
      where: { id },
      data,
      include: this.getDefaultInclude(),
    });
  }
}

// Query operations repository
export class AppointmentQueryRepository
  extends BaseAppointmentRepository
  implements IAppointmentQuery
{
  async listAppointments(
    where: any,
    skip: number,
    take: number,
    orderBy: any,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations[]> {
    const client = this.getClient(tx);
    return client.appointment.findMany({
      where,
      include: this.getDefaultInclude(),
      skip,
      take,
      orderBy,
    });
  }

  async countAppointments(where: any, tx?: PrismaTransaction): Promise<number> {
    const client = this.getClient(tx);
    return client.appointment.count({ where });
  }
}

// Analytics repository
export class AppointmentAnalyticsRepository
  extends BaseAppointmentRepository
  implements IAppointmentAnalytics
{
  async getTotalIncome(where: any, tx?: PrismaTransaction) {
    const client = this.getClient(tx);
    return client.appointment.aggregate({
      where,
      _sum: {
        totalPrice: true,
      },
    });
  }

  async getTotalServices(where: any, tx?: PrismaTransaction) {
    const client = this.getClient(tx);
    return client.appointmentService.aggregate({
      where,
      _sum: {
        numberOfPeople: true,
      },
    });
  }
}

// User operations repository
export class AppointmentUserRepository
  extends BaseAppointmentRepository
  implements IAppointmentUserOperations
{
  async findUserAppointmentsWithFilters(
    userId: string,
    skip: number,
    take: number,
    orderBy: any,
    filters: any,
    tx?: PrismaTransaction
  ) {
    const client = this.getClient(tx);
    return client.appointment.findMany({
      where: {
        userId,
        ...filters,
      },
      skip,
      take,
      orderBy,
      include: {
        services: {
          include: {
            service: true,
          },
        },
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async countUserAppointments(
    userId: string,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<number> {
    const client = this.getClient(tx);
    return client.appointment.count({
      where: {
        userId,
        ...filters,
      },
    });
  }

  async findUserAppointmentById(
    id: string,
    userId: string,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations | null> {
    const client = this.getClient(tx);
    return client.appointment.findFirst({
      where: { id, userId },
      include: this.getDefaultInclude(),
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
}

// Stylist operations repository
export class AppointmentStylistRepository
  extends BaseAppointmentRepository
  implements IAppointmentStylistOperations
{
  async findStylistAppointments(
    stylistId: string,
    skip: number,
    take: number,
    orderBy: any,
    filters: any,
    tx?: PrismaTransaction
  ) {
    const client = this.getClient(tx);
    return client.appointment.findMany({
      where: {
        stylistId,
        ...filters,
      },
      skip,
      take,
      orderBy,
      include: {
        services: {
          include: {
            service: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async countStylistAppointments(
    stylistId: string,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<number> {
    const client = this.getClient(tx);
    return client.appointment.count({
      where: {
        stylistId,
        ...filters,
      },
    });
  }

  async findStylistAppointmentById(
    id: string,
    stylistId: string,
    tx?: PrismaTransaction
  ): Promise<AppointmentWithRelations | null> {
    const client = this.getClient(tx);
    return client.appointment.findFirst({
      where: { id, stylistId },
      include: this.getDefaultInclude(),
    });
  }
}

// Management repository
export class AppointmentManagementRepository
  extends BaseAppointmentRepository
  implements IAppointmentManagement
{
  async cancelAppointments(
    appointmentIds: string[],
    reason: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.appointment.updateMany({
      where: {
        id: { in: appointmentIds },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      data: {
        status: "CANCELLED",
        notes: reason,
      },
    });
  }
}

// Main repository that combines all functionality
export class AppointmentRepository implements IAppointmentRepository {
  private crud: AppointmentCRUDRepository;
  private query: AppointmentQueryRepository;
  private analytics: AppointmentAnalyticsRepository;
  private user: AppointmentUserRepository;
  private stylist: AppointmentStylistRepository;
  private management: AppointmentManagementRepository;

  constructor(prisma: PrismaClient) {
    this.crud = new AppointmentCRUDRepository(prisma);
    this.query = new AppointmentQueryRepository(prisma);
    this.analytics = new AppointmentAnalyticsRepository(prisma);
    this.user = new AppointmentUserRepository(prisma);
    this.stylist = new AppointmentStylistRepository(prisma);
    this.management = new AppointmentManagementRepository(prisma);
  }

  // Delegate all methods to appropriate repositories
  createAppointment = (data: AppointmentCreateData, tx?: PrismaTransaction) =>
    this.crud.createAppointment(data, tx);

  findAppointmentById = (id: string, tx?: PrismaTransaction) =>
    this.crud.findAppointmentById(id, tx);

  updateAppointment = (id: string, data: any, tx?: PrismaTransaction) =>
    this.crud.updateAppointment(id, data, tx);

  listAppointments = (
    where: any,
    skip: number,
    take: number,
    orderBy: any,
    tx?: PrismaTransaction
  ) => this.query.listAppointments(where, skip, take, orderBy, tx);

  countAppointments = (where: any, tx?: PrismaTransaction) =>
    this.query.countAppointments(where, tx);

  getTotalIncome = (where: any, tx?: PrismaTransaction) =>
    this.analytics.getTotalIncome(where, tx);

  getTotalServices = (where: any, tx?: PrismaTransaction) =>
    this.analytics.getTotalServices(where, tx);

  findUserAppointmentsWithFilters = (
    userId: string,
    skip: number,
    take: number,
    orderBy: any,
    filters: any,
    tx?: PrismaTransaction
  ) =>
    this.user.findUserAppointmentsWithFilters(
      userId,
      skip,
      take,
      orderBy,
      filters,
      tx
    );

  countUserAppointments = (
    userId: string,
    filters: any,
    tx?: PrismaTransaction
  ) => this.user.countUserAppointments(userId, filters, tx);

  findUserAppointmentById = (
    id: string,
    userId: string,
    tx?: PrismaTransaction
  ) => this.user.findUserAppointmentById(id, userId, tx);

  findUserAppointments = (userId: string, tx?: PrismaTransaction) =>
    this.user.findUserAppointments(userId, tx);

  findActiveAppointments = (userId: string, tx?: PrismaTransaction) =>
    this.user.findActiveAppointments(userId, tx);

  findStylistAppointments = (
    stylistId: string,
    skip: number,
    take: number,
    orderBy: any,
    filters: any,
    tx?: PrismaTransaction
  ) =>
    this.stylist.findStylistAppointments(
      stylistId,
      skip,
      take,
      orderBy,
      filters,
      tx
    );

  countStylistAppointments = (
    stylistId: string,
    filters: any,
    tx?: PrismaTransaction
  ) => this.stylist.countStylistAppointments(stylistId, filters, tx);

  findStylistAppointmentById = (
    id: string,
    stylistId: string,
    tx?: PrismaTransaction
  ) => this.stylist.findStylistAppointmentById(id, stylistId, tx);

  cancelAppointments = (
    appointmentIds: string[],
    reason: string,
    tx?: PrismaTransaction
  ) => this.management.cancelAppointments(appointmentIds, reason, tx);
}
