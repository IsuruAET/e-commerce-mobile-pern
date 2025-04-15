import { PrismaClient, Prisma } from "@prisma/client";

import { AppError } from "middleware/errorHandler";

const prisma = new PrismaClient();

export class CategoryService {
  static async createCategory(data: {
    name: string;
    description: string;
    image: string;
  }) {
    try {
      return await prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          image: data.image,
          isActive: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new AppError(409, "Category with this name already exists");
        }
      }
      throw new AppError(500, "Failed to create category");
    }
  }

  static async getCategoryById(id: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new AppError(404, "Category not found");
      }

      return category;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to retrieve category");
    }
  }

  static async listCategories() {
    try {
      return await prisma.category.findMany({
        where: { isActive: true },
      });
    } catch (error) {
      throw new AppError(500, "Failed to retrieve categories");
    }
  }

  static async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      isActive?: boolean;
    }
  ) {
    try {
      const category = await prisma.category.update({
        where: { id },
        data,
      });
      return category;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new AppError(404, "Category not found");
        }
        if (error.code === "P2002") {
          throw new AppError(409, "Category with this name already exists");
        }
      }
      throw new AppError(500, "Failed to update category");
    }
  }

  static async deleteCategory(id: string) {
    try {
      // First check if category exists and has any services
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          services: true,
        },
      });

      if (!category) {
        throw new AppError(404, "Category not found");
      }

      if (category.services.length > 0) {
        throw new AppError(
          400,
          "Cannot delete category that has associated services. Please delete or reassign the services first."
        );
      }

      await prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new AppError(404, "Category not found");
        }
      }
      throw new AppError(500, "Failed to delete category");
    }
  }
}
