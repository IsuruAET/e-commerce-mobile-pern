import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../schemas/appointmentSchema";
import { BaseService } from "./shared/baseService";
import { DateTime } from "luxon";
import {
  buildQueryOptions,
  buildPagination,
  PaginatedResponse,
} from "../../../utils/queryBuilder";
import {
  AppointmentRepository,
  PrismaTransaction,
} from "../repositories/appointmentRepository";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

interface AppointmentQueryOptions {
  statuses?: string[];
  dateRange?: { from?: string; to?: string };
  // Add other potential filter fields relevant to user/stylist appointments
}

export class AppointmentService extends BaseService {
  private static appointmentRepository = new AppointmentRepository(
    BaseService.prisma
  );

  static async createAppointment(
    input: CreateAppointmentInput["body"],
    userId: string
  ) {
    return await this.handleWithTimeout(async () => {
      return await this.handleTransaction(async (tx: PrismaTransaction) => {
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

        return this.appointmentRepository.createAppointment(
          {
            userId,
            stylistId: input.stylistId,
            dateTime: appointmentDateTime,
            notes: input.notes,
            estimatedDuration,
            totalPrice,
            services: input.services,
          },
          tx
        );
      });
    }, 10000); // 10 second timeout
  }

  static async getAppointment(id: string) {
    return await this.handleNotFound(async () => {
      return this.appointmentRepository.findAppointmentById(id);
    });
  }

  static async updateAppointment(
    id: string,
    input: UpdateAppointmentInput["body"]
  ) {
    return await this.handleWithTimeout(async () => {
      return await this.handleTransaction(async (tx: PrismaTransaction) => {
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

        return this.appointmentRepository.updateAppointment(id, updateData, tx);
      });
    }, 10000); // 10 second timeout
  }

  static async getUserAppointments(
    userId: string,
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(queryParams, {
        stylistIds: { type: "array", field: "stylistId" },
        statuses: { type: "array", field: "status" },
        dateRange: {
          type: "dateRange",
          from: "startDate",
          to: "endDate",
          field: "dateTime",
        },
      });

      const total = await this.appointmentRepository.countUserAppointments(
        userId,
        filters // Pass original filters, userId is handled by the specific repo method
      );

      const pagination = buildPagination(total, page, count);

      const appointments =
        await this.appointmentRepository.findUserAppointments(
          userId,
          (page - 1) * count,
          count,
          orderBy,
          filters // Pass original filters
        );

      return {
        list: appointments,
        pagination,
      };
    });
  }

  static async getStylistAppointments(
    stylistId: string,
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(queryParams, {
        userIds: { type: "array", field: "userId" },
        statuses: { type: "array", field: "status" },
        dateRange: {
          type: "dateRange",
          from: "startDate",
          to: "endDate",
          field: "dateTime",
        },
      });

      const total = await this.appointmentRepository.countStylistAppointments(
        stylistId,
        filters // Pass original filters, stylistId is handled by the specific repo method
      );
      const pagination = buildPagination(total, page, count);

      const appointments =
        await this.appointmentRepository.findStylistAppointments(
          stylistId,
          (page - 1) * count,
          count,
          orderBy,
          filters // Pass original filters
        );

      return {
        list: appointments,
        pagination,
      };
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

      const result = await this.appointmentRepository.getTotalIncome(where);
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

      const result = await this.appointmentRepository.getTotalServices(where);
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
      const total = await this.appointmentRepository.countAppointments(filters);

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const appointments = await this.appointmentRepository.listAppointments(
        filters,
        (page - 1) * count,
        count,
        orderBy
      );

      return {
        list: appointments,
        pagination,
      };
    });
  }

  static async getUserAppointmentById(id: string, userId: string) {
    return await this.handleNotFound(async () => {
      return this.appointmentRepository.findUserAppointmentById(id, userId);
    });
  }

  static async getStylistAppointmentById(id: string, stylistId: string) {
    return await this.handleNotFound(async () => {
      return this.appointmentRepository.findStylistAppointmentById(
        id,
        stylistId
      );
    });
  }

  static async updateAppointmentStatus(
    appointmentId: string,
    newStatus: string
  ) {
    return await this.handleDatabaseError(async () => {
      const appointment = await this.appointmentRepository.findAppointmentById(
        appointmentId
      );

      // Validate status transition
      const currentStatus = appointment?.status;
      const validTransitions: Record<string, string[]> = {
        PENDING: ["CONFIRMED", "CANCELLED", "COMPLETED"],
        CONFIRMED: ["COMPLETED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: [],
      };

      if (
        currentStatus &&
        !validTransitions[currentStatus].includes(newStatus)
      ) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Cannot change status from ${currentStatus} to ${newStatus}`
        );
      }

      const updatedAppointment =
        await this.appointmentRepository.updateAppointment(appointmentId, {
          status: newStatus,
        });

      return updatedAppointment;
    });
  }
}
