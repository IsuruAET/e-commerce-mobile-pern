import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schemas/categorySchema";
import { BaseService } from "./shared/baseService";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import {
  buildQueryOptions,
  buildPagination,
  PaginatedResponse,
} from "utils/queryBuilder";

export class CategoryService extends BaseService {
  static async addCategory(data: CreateCategoryInput) {
    return await this.handleDatabaseError(async () => {
      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          image: data.image,
          isActive: data.isActive,
        },
      });

      return category;
    });
  }

  static async getCategoryById(id: string) {
    return await this.handleNotFound(async () => {
      return await this.prisma.category.findUnique({
        where: { id },
      });
    });
  }

  static async listCategories(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
    return await this.handleDatabaseError(async () => {
      const { page, count, filters, orderBy } = buildQueryOptions(queryParams, {
        isActive: { type: "boolean" },
      });

      // Get the total count with the filters
      const total = await this.prisma.category.count({ where: filters });

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const categories = await this.prisma.category.findMany({
        where: filters,
        skip: (page - 1) * count,
        take: count,
        orderBy,
      });

      return {
        data: categories,
        pagination,
      };
    });
  }

  static async updateCategory(id: string, data: UpdateCategoryInput) {
    return await this.handleNotFound(async () => {
      const category = await this.prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          image: data.image,
          isActive: data.isActive,
        },
      });

      return category;
    });
  }

  static async deleteCategory(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if category has any services
      const services = await tx.service.findFirst({
        where: { categoryId: id },
      });

      if (services) {
        throw new AppError(ErrorCode.CATEGORY_HAS_SERVICES);
      }

      await tx.category.delete({
        where: { id },
      });
    });
  }

  static async deactivateCategory(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Find all active services in this category
      const activeServices = await tx.service.findMany({
        where: {
          categoryId: id,
          isActive: true,
        },
      });

      // Deactivate all services in this category
      if (activeServices.length > 0) {
        await tx.service.updateMany({
          where: {
            id: {
              in: activeServices.map((service) => service.id),
            },
          },
          data: {
            isActive: false,
          },
        });
      }

      // Deactivate the category
      await tx.category.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
    });
  }

  static async reactivateCategory(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Find all inactive services in this category
      const inactiveServices = await tx.service.findMany({
        where: {
          categoryId: id,
          isActive: false,
        },
      });

      // Reactivate all services in this category
      if (inactiveServices.length > 0) {
        await tx.service.updateMany({
          where: {
            id: {
              in: inactiveServices.map((service) => service.id),
            },
          },
          data: {
            isActive: true,
          },
        });
      }

      // Reactivate the category
      await tx.category.update({
        where: { id },
        data: {
          isActive: true,
        },
      });
    });
  }
}
