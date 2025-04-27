import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../schemas/appointmentSchema";
import { BaseService } from "./baseService";
import { DateTime } from "luxon";
import {
  buildQueryOptions,
  buildPagination,
  PaginatedResponse,
} from "../../../utils/queryBuilder";

export class AppointmentService extends BaseService {
  static async createAppointment(
    input: CreateAppointmentInput["body"],
    userId: string
  ) {
    return await this.handleWithTimeout(async () => {
      return await this.handleTransaction(async (tx) => {
        // First, get all services to calculate total price and duration
        const services = await tx.service.findMany({
          where: {
            id: {
              in: input.services.map((s: { serviceId: string }) => s.serviceId),
            },
          },
        });

        // Calculate total price and duration based on number of people per service
        const totalPrice = input.services.reduce(
          (sum: number, serviceInput) => {
            const service = services.find(
              (s) => s.id === serviceInput.serviceId
            );
            return (
              sum + (Number(service?.price) || 0) * serviceInput.numberOfPeople
            );
          },
          0
        );

        const estimatedDuration = services.reduce(
          (sum: number, service) => sum + service.duration,
          0
        );

        // Convert input dateTime to JS Date
        const appointmentDateTime = DateTime.fromISO(input.dateTime).toJSDate();

        return tx.appointment.create({
          data: {
            userId,
            stylistId: input.stylistId,
            dateTime: appointmentDateTime,
            notes: input.notes,
            estimatedDuration,
            totalPrice,
            services: {
              create: input.services.map((serviceInput) => ({
                serviceId: serviceInput.serviceId,
                numberOfPeople: serviceInput.numberOfPeople,
              })),
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
      });
    }, 10000); // 10 second timeout
  }

  static async getAppointment(id: string) {
    return await this.handleNotFound(async () => {
      return this.prisma.appointment.findUnique({
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
    });
  }

  static async updateAppointment(
    id: string,
    input: UpdateAppointmentInput["body"]
  ) {
    return await this.handleWithTimeout(async () => {
      return await this.handleTransaction(async (tx) => {
        let updateData: any = {
          status: input.status,
          notes: input.notes,
        };

        if (input.dateTime) {
          updateData.dateTime = DateTime.fromISO(input.dateTime).toJSDate();
        }

        if (input.services) {
          // Get all services to calculate new total price and duration
          const services = await tx.service.findMany({
            where: {
              id: {
                in: input.services.map(
                  (s: { serviceId: string }) => s.serviceId
                ),
              },
            },
          });

          // Calculate total price and duration based on number of people per service
          const totalPrice = input.services.reduce(
            (sum: number, serviceInput) => {
              const service = services.find(
                (s) => s.id === serviceInput.serviceId
              );
              return (
                sum +
                (Number(service?.price) || 0) * serviceInput.numberOfPeople
              );
            },
            0
          );

          const estimatedDuration = services.reduce(
            (sum: number, service) => sum + service.duration,
            0
          );

          updateData = {
            ...updateData,
            totalPrice,
            estimatedDuration,
            services: {
              deleteMany: {},
              create: input.services.map((serviceInput) => ({
                serviceId: serviceInput.serviceId,
                numberOfPeople: serviceInput.numberOfPeople,
              })),
            },
          };
        }

        return tx.appointment.update({
          where: { id },
          data: updateData,
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
      });
    }, 10000); // 10 second timeout
  }

  static async getUserAppointments(userId: string) {
    return await this.handleDatabaseError(async () => {
      return this.prisma.appointment.findMany({
        where: { userId },
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
        orderBy: {
          dateTime: "asc",
        },
      });
    });
  }

  static async getStylistAppointments(stylistId: string) {
    return await this.handleDatabaseError(async () => {
      return this.prisma.appointment.findMany({
        where: { stylistId },
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
        orderBy: {
          dateTime: "asc",
        },
      });
    });
  }

  static async getTotalIncome(
    stylistIds?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    return await this.handleDatabaseError(async () => {
      const where: any = {
        status: "COMPLETED",
        ...(stylistIds &&
          stylistIds.length > 0 && { stylistId: { in: stylistIds } }),
      };

      if (startDate || endDate) {
        where.dateTime = {};
        if (startDate) {
          where.dateTime.gte = DateTime.fromISO(startDate).toJSDate();
        }
        if (endDate) {
          where.dateTime.lte = DateTime.fromISO(endDate).toJSDate();
        }
      }

      const result = await this.prisma.appointment.aggregate({
        where,
        _sum: {
          totalPrice: true,
        },
      });
      return Number(result._sum?.totalPrice || 0);
    });
  }

  static async getTotalServices(
    stylistIds?: string[],
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    return await this.handleDatabaseError(async () => {
      const where: any = {
        appointment: {
          status: "COMPLETED",
          ...(stylistIds &&
            stylistIds.length > 0 && { stylistId: { in: stylistIds } }),
        },
      };

      if (startDate || endDate) {
        where.appointment.dateTime = {};
        if (startDate) {
          where.appointment.dateTime.gte =
            DateTime.fromISO(startDate).toJSDate();
        }
        if (endDate) {
          where.appointment.dateTime.lte = DateTime.fromISO(endDate).toJSDate();
        }
      }

      const result = await this.prisma.appointmentService.aggregate({
        where,
        _sum: {
          numberOfPeople: true,
        },
      });
      return Number(result._sum?.numberOfPeople || 0);
    });
  }

  static async listAppointments(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(queryParams, {
        userIds: { type: "array", field: "userId" },
        stylistIds: { type: "array", field: "stylistId" },
        statuses: { type: "array", field: "status" },
        dateRange: {
          type: "dateRange",
          from: "startDate",
          to: "endDate",
          field: "dateTime",
        },
      });

      // Get the total count with the filters
      const total = await this.prisma.appointment.count({ where: filters });

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const appointments = await this.prisma.appointment.findMany({
        where: filters,
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
        skip: (page - 1) * count,
        take: count,
        orderBy,
      });

      return {
        data: appointments,
        pagination,
      };
    });
  }
}
