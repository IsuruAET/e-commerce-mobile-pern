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
import { CategoryRepository } from "../repositories/categoryRepository";

export class CategoryService extends BaseService {
  private static categoryRepository = new CategoryRepository(
    BaseService.prisma
  );

  static async createCategory(data: CreateCategoryInput) {
    return await this.handleDatabaseError(async () => {
      const category = await this.categoryRepository.createCategory({
        name: data.name,
        description: data.description || "",
        image: data.image || "",
        isActive: data.isActive,
      });

      return category;
    });
  }

  static async getCategoryById(id: string) {
    return await this.handleNotFound(async () => {
      return await this.categoryRepository.findCategoryById(id);
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
      const total = await this.categoryRepository.countCategories(filters);

      const pagination = buildPagination(total, page, count);

      // Apply pagination and sorting
      const categories = await this.categoryRepository.findCategories(
        filters,
        (page - 1) * count,
        count,
        orderBy || {}
      );

      return {
        list: categories,
        pagination,
      };
    });
  }

  static async updateCategory(id: string, data: UpdateCategoryInput) {
    return await this.handleNotFound(async () => {
      const category = await this.categoryRepository.updateCategory(id, {
        name: data.name,
        description: data.description,
        image: data.image,
        isActive: data.isActive,
      });

      return category;
    });
  }

  static async deleteCategory(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Check if category has any services
      const services = await this.categoryRepository.findServicesByCategoryId(
        id
      );

      if (services.length > 0) {
        throw new AppError(ErrorCode.CATEGORY_HAS_SERVICES);
      }

      await this.categoryRepository.deleteCategory(id);
    });
  }

  static async deactivateCategory(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Deactivate all services in this category
      await this.categoryRepository.updateCategoryServices(id, false);

      // Deactivate the category
      await this.categoryRepository.updateCategory(id, {
        isActive: false,
      });
    });
  }

  static async reactivateCategory(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Reactivate all services in this category
      await this.categoryRepository.updateCategoryServices(id, true);

      // Reactivate the category
      await this.categoryRepository.updateCategory(id, {
        isActive: true,
      });
    });
  }
}
