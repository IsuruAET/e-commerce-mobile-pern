import { PrismaClient, Category, Prisma } from "@prisma/client";

// Define a type for the Prisma transaction
export type PrismaTransaction = Prisma.TransactionClient;

export interface ICategoryRepository {
  // Category operations
  createCategory(
    data: {
      name: string;
      description: string;
      image: string;
      isActive: boolean;
    },
    tx?: PrismaTransaction
  ): Promise<Category>;

  findCategoryById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<Category | null>;

  findCategories(
    filters: Record<string, any>,
    skip: number,
    take: number,
    orderBy: Record<string, any>,
    tx?: PrismaTransaction
  ): Promise<Category[]>;

  countCategories(
    filters: Record<string, any>,
    tx?: PrismaTransaction
  ): Promise<number>;

  updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      isActive?: boolean;
    },
    tx?: PrismaTransaction
  ): Promise<Category>;

  deleteCategory(id: string, tx?: PrismaTransaction): Promise<Category>;
}

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  async createCategory(
    data: {
      name: string;
      description: string;
      image: string;
      isActive: boolean;
    },
    tx?: PrismaTransaction
  ): Promise<Category> {
    const client = this.getClient(tx);
    return client.category.create({
      data,
    });
  }

  async findCategoryById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<Category | null> {
    const client = this.getClient(tx);
    return client.category.findUnique({
      where: { id },
    });
  }

  async findCategories(
    filters: Record<string, any>,
    skip: number,
    take: number,
    orderBy: Record<string, any>,
    tx?: PrismaTransaction
  ): Promise<Category[]> {
    const client = this.getClient(tx);
    return client.category.findMany({
      where: filters,
      skip,
      take,
      orderBy,
    });
  }

  async countCategories(
    filters: Record<string, any>,
    tx?: PrismaTransaction
  ): Promise<number> {
    const client = this.getClient(tx);
    return client.category.count({
      where: filters,
    });
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      isActive?: boolean;
    },
    tx?: PrismaTransaction
  ): Promise<Category> {
    const client = this.getClient(tx);
    return client.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string, tx?: PrismaTransaction): Promise<Category> {
    const client = this.getClient(tx);
    return client.category.delete({
      where: { id },
    });
  }
}
