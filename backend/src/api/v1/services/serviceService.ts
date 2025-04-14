import { PrismaClient, Prisma, Service } from "@prisma/client";
import { AppError } from "../../../middleware/errorHandler";
import { Request } from "express";
import { formatPaginationResponse } from "../../../middleware/paginationHandler";

const prisma = new PrismaClient();

export class ServiceService {
  static async createService(data: {
    name: string;
    description: string;
    price: number;
    duration: number;
    categoryId: string;
    images: string[];
  }) {
    try {
      // First create the service
      const service = await prisma.service.create({
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
          prisma.serviceImage.create({
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new AppError(409, "Service with this name already exists");
        }
        if (error.code === "P2003") {
          throw new AppError(404, "Category not found");
        }
      }
      throw new AppError(500, "Failed to create service");
    }
  }

  static async getServiceById(id: string) {
    try {
      const service = await prisma.service.findUnique({
        where: { id },
        include: {
          images: true,
          category: true,
        },
      });

      if (!service) {
        throw new AppError(404, "Service not found");
      }

      return service;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to retrieve service");
    }
  }

  static async listActiveServices(req: Request) {
    try {
      const { skip, limit } = req.pagination;

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where: {
            isActive: true,
          },
          skip,
          take: limit,
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
        prisma.service.count({
          where: {
            isActive: true,
          },
        }),
      ]);

      return {
        data: services,
        pagination: formatPaginationResponse(req, total),
      };
    } catch (error) {
      throw new AppError(500, "Failed to retrieve active services");
    }
  }

  static async listAllServices(req: Request) {
    try {
      const { skip, limit } = req.pagination;

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          skip,
          take: limit,
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
        prisma.service.count(),
      ]);

      return {
        data: services,
        pagination: formatPaginationResponse(req, total),
      };
    } catch (error) {
      throw new AppError(500, "Failed to retrieve all services");
    }
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
    try {
      // Update service
      const service = await prisma.service.update({
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
        await prisma.serviceImage.deleteMany({
          where: { serviceId: id },
        });

        // Create new images
        const newImages = await Promise.all(
          data.images.map((url) =>
            prisma.serviceImage.create({
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new AppError(404, "Service not found");
        }
        if (error.code === "P2002") {
          throw new AppError(409, "Service with this name already exists");
        }
        if (error.code === "P2003") {
          throw new AppError(404, "Category not found");
        }
      }
      throw new AppError(500, "Failed to update service");
    }
  }

  static async deleteService(id: string) {
    try {
      // First delete all service images
      await prisma.serviceImage.deleteMany({
        where: { serviceId: id },
      });

      // Then delete the service
      await prisma.service.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new AppError(404, "Service not found");
        }
      }
      throw new AppError(500, "Failed to delete service");
    }
  }
}
