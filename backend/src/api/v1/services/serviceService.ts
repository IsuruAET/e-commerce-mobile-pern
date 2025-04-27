import { BaseService } from "./shared/baseService";
import {
  buildQueryOptions,
  buildPagination,
  PaginatedResponse,
} from "utils/queryBuilder";

export class ServiceService extends BaseService {
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
      const service = await tx.service.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          duration: data.duration,
          categoryId: data.categoryId,
          isActive: true,
        },
      });

      // Then create the service images
      const serviceImages = await Promise.all(
        data.images.map((url) =>
          tx.serviceImage.create({
            data: {
              url,
              serviceId: service.id,
            },
          })
        )
      );

      return {
        ...service,
        images: serviceImages,
      };
    });
  }

  static async getServiceById(id: string) {
    return await this.handleNotFound(async () => {
      return await this.prisma.service.findUnique({
        where: { id },
        include: {
          images: true,
          category: true,
        },
      });
    });
  }

  static async listActiveServices(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(queryParams, {
        categoryIds: { type: "array", field: "categoryId" },
      });

      // Get the total count with the filters
      const total = await this.prisma.service.count({
        where: {
          isActive: true,
          ...filters,
        },
      });

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const services = await this.prisma.service.findMany({
        where: {
          isActive: true,
          ...filters,
        },
        include: {
          images: true,
          category: true,
        },
        skip: (page - 1) * count,
        take: count,
        orderBy,
      });

      return {
        data: services,
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
      const total = await this.prisma.service.count({ where: filters });

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const services = await this.prisma.service.findMany({
        where: filters,
        include: {
          images: true,
          category: true,
        },
        skip: (page - 1) * count,
        take: count,
        orderBy,
      });

      return {
        data: services,
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
      const service = await tx.service.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          duration: data.duration,
          categoryId: data.categoryId,
          isActive: data.isActive,
        },
        include: {
          images: true,
        },
      });

      // If images are provided, update them
      if (data.images) {
        // Delete existing images
        await tx.serviceImage.deleteMany({
          where: { serviceId: id },
        });

        // Create new images
        const newImages = await Promise.all(
          data.images.map((url) =>
            tx.serviceImage.create({
              data: {
                url,
                serviceId: id,
              },
            })
          )
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
      // First delete all service images
      await tx.serviceImage.deleteMany({
        where: { serviceId: id },
      });

      // Then delete the service
      await tx.service.delete({
        where: { id },
      });
    });
  }
}
