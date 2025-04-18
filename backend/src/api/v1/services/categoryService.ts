import { BaseService } from "./baseService";

export class CategoryService extends BaseService {
  static async createCategory(data: {
    name: string;
    description: string;
    image: string;
  }) {
    return await this.handleDatabaseError(async () => {
      return await this.prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          image: data.image,
          isActive: true,
        },
      });
    });
  }

  static async getCategoryById(id: string) {
    return await this.handleNotFound(async () => {
      return await this.prisma.category.findUnique({
        where: { id },
      });
    });
  }

  static async listCategories() {
    return await this.handleDatabaseError(async () => {
      return await this.prisma.category.findMany({
        where: { isActive: true },
      });
    });
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
    return await this.handleNotFound(async () => {
      return await this.prisma.category.update({
        where: { id },
        data,
      });
    });
  }

  static async deleteCategory(id: string) {
    return await this.handleDatabaseError(async () => {
      // First check if category exists
      await this.handleNotFound(async () => {
        return await this.prisma.category.findUnique({
          where: { id },
        });
      });

      await this.prisma.category.delete({
        where: { id },
      });
    });
  }
}
