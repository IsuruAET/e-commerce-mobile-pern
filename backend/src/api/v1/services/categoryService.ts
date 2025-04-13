import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CategoryService {
  static async createCategory(data: {
    name: string;
    description: string;
    image: string;
  }) {
    return prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        isActive: true,
      },
    });
  }

  static async deleteCategory(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}
