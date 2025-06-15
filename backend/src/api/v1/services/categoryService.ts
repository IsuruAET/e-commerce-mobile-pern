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
import { ServiceRepository } from "../repositories/serviceRepository";
import { prismaClient } from "config/prisma";

export class CategoryService extends BaseService {
  private readonly categoryRepository: CategoryRepository;
  private readonly serviceRepository: ServiceRepository;

  constructor() {
    super(prismaClient);
    this.categoryRepository = new CategoryRepository(this.prisma);
    this.serviceRepository = new ServiceRepository(this.prisma);
  }

  async createCategory(data: CreateCategoryInput) {
    const category = await this.categoryRepository.createCategory({
      name: data.name,
      description: data.description || "",
      image: data.image || "",
      isActive: data.isActive,
    });

    return category;
  }

  async getCategoryById(id: string) {
    return await this.handleNotFound(async () => {
      return await this.categoryRepository.findCategoryById(id);
    });
  }

  async listCategories(
    queryParams: Record<string, any>
  ): Promise<PaginatedResponse<any>> {
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
  }

  async updateCategory(id: string, data: UpdateCategoryInput) {
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

  async deleteCategory(id: string) {
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

  async deactivateCategory(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Get all services in this category
      const services = await this.categoryRepository.findServicesByCategoryId(
        id,
        tx
      );

      if (services.length === 0) {
        return;
      }

      // Get all appointments for all services in a single query
      const serviceIds = services.map((service) => service.id);
      const allAppointments =
        await this.serviceRepository.findAppointmentsByServiceIds(
          serviceIds,
          tx
        );

      // Check if any appointments are active
      const hasActiveAppointments = allAppointments.some(
        (appointment) =>
          appointment.appointment.status === "PENDING" ||
          appointment.appointment.status === "CONFIRMED"
      );

      if (hasActiveAppointments) {
        const activeAppointments = allAppointments.filter(
          (appointment) =>
            appointment.appointment.status === "PENDING" ||
            appointment.appointment.status === "CONFIRMED"
        );

        const appointmentIds = activeAppointments
          .map((appointment) => appointment.appointment.id)
          .join(", ");

        throw new AppError(
          ErrorCode.CATEGORY_HAS_APPOINTMENTS,
          `Cannot deactivate category because there are pending or confirmed appointments with IDs: ${appointmentIds}`
        );
      }

      // Deactivate all services in this category
      await this.categoryRepository.updateCategoryServices(id, false, tx);

      // Deactivate the category
      await this.categoryRepository.updateCategory(
        id,
        {
          isActive: false,
        },
        tx
      );
    });
  }

  async reactivateCategory(id: string) {
    return await this.handleTransaction(async (tx) => {
      // Reactivate all services in this category
      await this.categoryRepository.updateCategoryServices(id, true);

      // Reactivate the category
      await this.categoryRepository.updateCategory(id, {
        isActive: true,
      });
    });
  }

  async getCategoriesForDropdown() {
    const categories = await this.categoryRepository.findCategories(
      { isActive: true },
      0,
      1000,
      { name: "asc" }
    );

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
    }));
  }
}
