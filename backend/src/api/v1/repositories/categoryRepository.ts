import { PrismaClient, Category, Prisma } from "@prisma/client";

// Define a type for the Prisma transaction
export type PrismaTransaction = Prisma.TransactionClient;

// Base types
export type CategoryWithRelations = Category;

// Core CRUD operations
export interface ICategoryCRUD {
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

// Query operations
export interface ICategoryQuery {
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
}

// Combined interface for the main repository
export interface ICategoryRepository extends ICategoryCRUD, ICategoryQuery {}

// Base repository with common functionality
export abstract class BaseCategoryRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }
}

// CRUD operations repository
export class CategoryCRUDRepository
  extends BaseCategoryRepository
  implements ICategoryCRUD
{
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
    return client.category.create({ data });
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

// Query operations repository
export class CategoryQueryRepository
  extends BaseCategoryRepository
  implements ICategoryQuery
{
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
}

// Main repository that combines all functionality
export class CategoryRepository implements ICategoryRepository {
  private crud: CategoryCRUDRepository;
  private query: CategoryQueryRepository;

  constructor(prisma: PrismaClient) {
    this.crud = new CategoryCRUDRepository(prisma);
    this.query = new CategoryQueryRepository(prisma);
  }

  // Delegate all methods to appropriate repositories
  createCategory = (
    data: {
      name: string;
      description: string;
      image: string;
      isActive: boolean;
    },
    tx?: PrismaTransaction
  ) => this.crud.createCategory(data, tx);

  findCategoryById = (id: string, tx?: PrismaTransaction) =>
    this.crud.findCategoryById(id, tx);

  updateCategory = (
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      isActive?: boolean;
    },
    tx?: PrismaTransaction
  ) => this.crud.updateCategory(id, data, tx);

  deleteCategory = (id: string, tx?: PrismaTransaction) =>
    this.crud.deleteCategory(id, tx);

  findCategories = (
    filters: Record<string, any>,
    skip: number,
    take: number,
    orderBy: Record<string, any>,
    tx?: PrismaTransaction
  ) => this.query.findCategories(filters, skip, take, orderBy, tx);

  countCategories = (filters: Record<string, any>, tx?: PrismaTransaction) =>
    this.query.countCategories(filters, tx);
}
