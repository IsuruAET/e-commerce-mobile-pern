import { Request } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "middleware/errorHandler";
import { formatPaginationResponse } from "middleware/paginationHandler";
import { BaseService } from "./baseService";
import { ErrorCode } from "../../../constants/errorCodes";

export class ServiceService extends BaseService {
  static async createService(data: {
    name: string;
    description: string;
    price: number;
    duration: number;
    categoryId: string;
    images: string[];
  }) {
    return await this.handleDatabaseError(async () => {
      // First create the service
      const service = await this.prisma.service.create({
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
          this.prisma.serviceImage.create({
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

  static async listActiveServices(req: Request) {
    return await this.handleDatabaseError(async () => {
      const { skip, limit } = req.pagination;
      const filters = req.filters || {};
      const sortOptions = req.sortOptions || [
        { field: "createdAt", order: "desc" },
      ];

      const [services, total] = await Promise.all([
        this.prisma.service.findMany({
          where: {
            isActive: true,
            ...filters,
          },
          skip,
          take: limit,
          orderBy: sortOptions.map((option) => ({
            [option.field]: option.order,
          })),
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.service.count({
          where: {
            isActive: true,
            ...filters,
          },
        }),
      ]);

      return {
        data: services,
        pagination: formatPaginationResponse(req, total),
      };
    });
  }

  static async listAllServices(req: Request) {
    return await this.handleDatabaseError(async () => {
      const { skip, limit } = req.pagination;
      const filters = req.filters || {};
      const sortOptions = req.sortOptions || [
        { field: "createdAt", order: "desc" },
      ];

      const [services, total] = await Promise.all([
        this.prisma.service.findMany({
          where: filters,
          skip,
          take: limit,
          orderBy: sortOptions.map((option) => ({
            [option.field]: option.order,
          })),
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            category: true,
          },
        }),
        this.prisma.service.count({
          where: filters,
        }),
      ]);

      return {
        data: services,
        pagination: formatPaginationResponse(req, total),
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
    return await this.handleNotFound(async () => {
      // Update service
      const service = await this.prisma.service.update({
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
        await this.prisma.serviceImage.deleteMany({
          where: { serviceId: id },
        });

        // Create new images
        const newImages = await Promise.all(
          data.images.map((url) =>
            this.prisma.serviceImage.create({
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
    return await this.handleDatabaseError(async () => {
      // First delete all service images
      await this.prisma.serviceImage.deleteMany({
        where: { serviceId: id },
      });

      // Then delete the service
      await this.prisma.service.delete({
        where: { id },
      });
    });
  }
}
