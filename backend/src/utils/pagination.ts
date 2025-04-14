import { PrismaClient, Prisma } from "@prisma/client";

export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: Record<string, "asc" | "desc">;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export async function paginate<T>(
  prisma: PrismaClient,
  model: keyof PrismaClient,
  options: PaginationOptions,
  where?: any,
  include?: any
): Promise<PaginatedResult<T>> {
  const { page, limit, orderBy } = options;
  const skip = (page - 1) * limit;

  const [data, totalItems] = await Promise.all([
    (prisma[model] as any).findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy,
    }),
    (prisma[model] as any).count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
}
