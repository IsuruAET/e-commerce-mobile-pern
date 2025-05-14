import {
  PrismaClient,
  Appointment,
  AppointmentService,
  Prisma,
} from "@prisma/client";
import { DateTime } from "luxon";

// Define a type for the Prisma transaction
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface IAppointmentRepository {
  // Appointment operations
  createAppointment(
    data: {
      userId: string;
      stylistId: string;
      dateTime: Date;
      notes?: string;
      estimatedDuration: number;
      totalPrice: number;
      services: {
        serviceId: string;
        numberOfPeople: number;
      }[];
    },
    tx?: PrismaTransaction
  ): Promise<
    Appointment & {
      services: (AppointmentService & {
        service: any;
      })[];
      user: {
        id: string;
        name: string;
        email: string;
      };
      stylist: {
        id: string;
        name: string;
        email: string;
      };
    }
  >;

  findAppointmentById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<
    | (Appointment & {
        services: (AppointmentService & {
          service: any;
        })[];
        user: {
          id: string;
          name: string;
          email: string;
        };
        stylist: {
          id: string;
          name: string;
          email: string;
        };
      })
    | null
  >;

  updateAppointment(
    id: string,
    data: any,
    tx?: PrismaTransaction
  ): Promise<
    Appointment & {
      services: (AppointmentService & {
        service: any;
      })[];
      user: {
        id: string;
        name: string;
        email: string;
      };
      stylist: {
        id: string;
        name: string;
        email: string;
      };
    }
  >;

  findUserAppointments(
    userId: string,
    skip: number,
    take: number,
    orderBy: any,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<
    (Appointment & {
      services: (AppointmentService & {
        service: any;
      })[];
      stylist: {
        id: string;
        name: string;
        email: string;
      };
    })[]
  >;

  findStylistAppointments(
    stylistId: string,
    skip: number,
    take: number,
    orderBy: any,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<
    (Appointment & {
      services: (AppointmentService & {
        service: any;
      })[];
      user: {
        id: string;
        name: string;
        email: string;
      };
    })[]
  >;

  getTotalIncome(
    where: any,
    tx?: PrismaTransaction
  ): Promise<{ _sum: { totalPrice: Prisma.Decimal | null } }>;

  getTotalServices(
    where: any,
    tx?: PrismaTransaction
  ): Promise<{ _sum: { numberOfPeople: number | null } }>;

  listAppointments(
    where: any,
    skip: number,
    take: number,
    orderBy: any,
    tx?: PrismaTransaction
  ): Promise<
    (Appointment & {
      services: (AppointmentService & {
        service: any;
      })[];
      user: {
        id: string;
        name: string;
        email: string;
      };
      stylist: {
        id: string;
        name: string;
        email: string;
      };
    })[]
  >;

  countAppointments(where: any, tx?: PrismaTransaction): Promise<number>;

  countUserAppointments(
    userId: string,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<number>;

  countStylistAppointments(
    stylistId: string,
    filters: any,
    tx?: PrismaTransaction
  ): Promise<number>;
}

export class AppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  async createAppointment(
    data: {
      userId: string;
      stylistId: string;
      dateTime: Date;
      notes?: string;
      estimatedDuration: number;
      totalPrice: number;
      services: {
        serviceId: string;
        numberOfPeople: number;
      }[];
    },
    tx?: PrismaTransaction
  ) {
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

  async findAppointmentById(id: string, tx?: PrismaTransaction) {
    const client = this.getClient(tx);
    return client.appointment.findUnique({
      where: { id },
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

  async updateAppointment(id: string, data: any, tx?: PrismaTransaction) {
    const client = this.getClient(tx);
    return client.appointment.update({
      where: { id },
      data,
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

  async findUserAppointments(
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

  async listAppointments(
    where: any,
    skip: number,
    take: number,
    orderBy: any,
    tx?: PrismaTransaction
  ) {
    const client = this.getClient(tx);
    return client.appointment.findMany({
      where,
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
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take,
      orderBy,
    });
  }

  async countAppointments(where: any, tx?: PrismaTransaction) {
    const client = this.getClient(tx);
    return client.appointment.count({ where });
  }
}
