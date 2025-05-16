import { BaseService } from "./shared/baseService";
import {
  buildQueryOptions,
  buildPagination,
  PaginatedResponse,
} from "utils/queryBuilder";
import { ServiceRepository } from "../repositories/serviceRepository";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "../../../constants/errorCodes";

export class ServiceService extends BaseService {
  private static serviceRepository = new ServiceRepository(BaseService.prisma);

  static async createService(data: {
    name: string;
    description: string;
    price: number;
    duration: number;
    categoryId: string;
    images: string[];
  }) {
    return await this.handleTransaction(async (tx) => {
      // First create the service
      const service = await this.serviceRepository.createService(
        {
          name: data.name,
          description: data.description,
          price: data.price,
          duration: data.duration,
          categoryId: data.categoryId,
          isActive: true,
        },
        tx
      );

      // Then create the service images
      const serviceImages = await this.serviceRepository.createServiceImages(
        data.images.map((url) => ({
          url,
          serviceId: service.id,
        })),
        tx
      );

      return {
        ...service,
        images: serviceImages,
      };
    });
  }

  static async getServiceById(id: string) {
    return await this.handleNotFound(async () => {
      return await this.serviceRepository.findServiceById(id);
    });
  }

  static async listActiveServices(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(queryParams, {
        categoryIds: { type: "array", field: "categoryId" },
      });

      const where = {
        isActive: true,
        ...filters,
      };

      // Get the total count with the filters
      const total = await this.serviceRepository.countServices(where);

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const services = await this.serviceRepository.findServices(
        where,
        {
          images: true,
          category: true,
        },
        (page - 1) * count,
        count,
        orderBy || {}
      );

      return {
        list: services,
        pagination,
      };
    });
  }

  static async listAllServices(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(queryParams, {
        categoryIds: { type: "array", field: "categoryId" },
        isActive: { type: "boolean" },
      });

      // Get the total count with the filters
      const total = await this.serviceRepository.countServices(filters);

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const services = await this.serviceRepository.findServices(
        filters,
        {
          images: true,
          category: true,
        },
        (page - 1) * count,
        count,
        orderBy || {}
      );

      return {
        list: services,
        pagination,
      };
    });
  }

  static async updateService(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
      categoryId?: string;
      isActive?: boolean;
      images?: string[];
    }
  ) {
    return await this.handleTransaction(async (tx) => {
      // Update service
      const service = await this.serviceRepository.updateService(
        id,
        {
          name: data.name,
          description: data.description,
          price: data.price,
          duration: data.duration,
          categoryId: data.categoryId,
          isActive: data.isActive,
        },
        tx
      );

      // If images are provided, update them
      if (data.images) {
        // Delete existing images
        await this.serviceRepository.deleteServiceImages(id, tx);

        // Create new images
        const newImages = await this.serviceRepository.createServiceImages(
          data.images.map((url) => ({
            url,
            serviceId: id,
          })),
          tx
        );

        return {
          ...service,
          images: newImages,
        };
      }

      return service;
    });
  }

  static async deleteService(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if service has any appointments
      const appointments =
        await this.serviceRepository.findAppointmentsByServiceId(id, tx);

      if (appointments.length > 0) {
        throw new AppError(ErrorCode.SERVICE_HAS_APPOINTMENTS);
      }

      // First delete all service images
      await this.serviceRepository.deleteServiceImages(id, tx);

      // Then delete the service
      await this.serviceRepository.deleteService(id, tx);
    });
  }

  static async getServicesForDropdown() {
    return await this.handleDatabaseError(async () => {
      const services = await this.serviceRepository.findServices(
        { isActive: true },
        {
          category: true,
        },
        0,
        1000,
        { name: "asc" }
      );

      return services.map((service) => ({
        id: service.id,
        name: service.name,
      }));
    });
  }

  static async deactivateService(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if service has any active appointments
      const appointments =
        await this.serviceRepository.findAppointmentsByServiceId(id, tx);

      if (appointments.length > 0) {
        const hasActiveAppointments = appointments.some(
          (appointment) =>
            appointment.appointment.status === "PENDING" ||
            appointment.appointment.status === "CONFIRMED"
        );

        if (hasActiveAppointments) {
          const activeAppointments = appointments.filter(
            (appointment) =>
              appointment.appointment.status === "PENDING" ||
              appointment.appointment.status === "CONFIRMED"
          );

          const appointmentIds = activeAppointments
            .map((appointment) => appointment.appointment.id)
            .join(", ");

          throw new AppError(
            ErrorCode.SERVICE_HAS_APPOINTMENTS,
            `Cannot deactivate service because there are pending or confirmed appointments with IDs: ${appointmentIds}`
          );
        }
      }

      // Deactivate the service
      await this.serviceRepository.updateService(
        id,
        {
          isActive: false,
        },
        tx
      );
    });
  }

  static async reactivateService(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Reactivate the service
      await this.serviceRepository.updateService(
        id,
        {
          isActive: true,
        },
        tx
      );
    });
  }
}
