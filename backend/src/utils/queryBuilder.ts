import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

// Constants
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

type FilterConfig = {
  type: "string" | "number" | "boolean" | "date" | "dateRange" | "array";
  from?: string;
  to?: string;
  field?: string;
  validate?: (value: any) => boolean;
  transform?: (value: any) => any;
};

type SortConfig = {
  type: "string" | "number" | "date";
  validate?: (value: any) => boolean;
  transform?: (value: any) => any;
};

type QueryOptions = {
  page: number;
  count: number;
  filters: Record<string, any>;
  orderBy?: Record<string, "asc" | "desc">;
};

type Pagination = {
  total: number;
  page: number;
  count: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

/**
 * Validates pagination parameters
 * @throws {AppError} If page or count parameters are invalid
 */
function validatePaginationParams(page: number, count: number): void {
  if (page < 1) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      `Page number must be greater than 0, received: ${page}`
    );
  }
  if (count < 1) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      `Count must be greater than 0, received: ${count}`
    );
  }
  if (count > MAX_PAGE_SIZE) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      `Count cannot exceed ${MAX_PAGE_SIZE}, received: ${count}`
    );
  }
}

/**
 * Converts sort parameters to Prisma orderBy format
 * @throws {AppError} If sort fields and orders have different lengths
 */
function convertToPrismaOrderBy(
  sortBy: string[],
  sortOrder: ("asc" | "desc")[]
): Record<string, "asc" | "desc"> {
  if (sortBy.length !== sortOrder.length) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      `Sort fields (${sortBy.length}) and orders (${sortOrder.length}) must have the same length`
    );
  }

  return sortBy.reduce(
    (acc, field, index) => ({
      ...acc,
      [field]: sortOrder[index],
    }),
    {}
  );
}

/**
 * Builds pagination metadata
 * @throws {AppError} If pagination parameters are invalid
 */
export function buildPagination(
  total: number,
  page: number,
  count: number
): Pagination {
  validatePaginationParams(page, count);

  return {
    total,
    page,
    count,
    totalPages: Math.ceil(total / count),
  };
}

/**
 * Parses date string into Date object
 * Supports both MM/DD/YYYY and ISO format
 */
function parseDate(dateStr: string): Date {
  if (dateStr.includes("/")) {
    const [month, day, year] = dateStr.split("/");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return new Date(dateStr);
}

/**
 * Validates sort order value
 * @throws {AppError} If sort order is invalid
 */
function validateSortOrder(order: string): asserts order is "asc" | "desc" {
  if (order !== "asc" && order !== "desc") {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      `Invalid sort order: ${order}. Must be either 'asc' or 'desc'`
    );
  }
}

/**
 * Handles date range filters in query parameters
 */
function handleDateRangeFilter(
  queryParams: Record<string, any>,
  filters: Record<string, any>,
  filterConfig: Record<string, FilterConfig>
): void {
  Object.entries(filterConfig).forEach(([key, config]) => {
    if (config.type === "dateRange" && config.from && config.to) {
      const fromValue = queryParams[config.from];
      const toValue = queryParams[config.to];
      const fieldName = config.field || key;

      if (fromValue || toValue) {
        filters[fieldName] = {};

        if (fromValue) {
          const fromDate = parseDate(fromValue);
          fromDate.setHours(0, 0, 0, 0);
          filters[fieldName].gte = fromDate;
        }

        if (toValue) {
          const toDate = parseDate(toValue);
          toDate.setHours(23, 59, 59, 999);
          filters[fieldName].lte = toDate;
        }
      }
    }
  });
}

/**
 * Applies a single filter based on its configuration
 * @throws {AppError} If filter validation fails
 */
function applyFilter(
  key: string,
  value: any,
  config: FilterConfig,
  filters: Record<string, any>
): void {
  const fieldName = config.field || key;

  // Skip filter if value is empty, '*', or 'all'
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "*" ||
    value === "all"
  ) {
    return;
  }

  if (config.validate && !config.validate(value)) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      `Invalid value for filter ${key}: ${value}`
    );
  }

  const transformedValue = config.transform ? config.transform(value) : value;

  switch (config.type) {
    case "string":
      filters[fieldName] = transformedValue;
      break;
    case "number":
      filters[fieldName] = Number(transformedValue);
      break;
    case "boolean":
      filters[fieldName] = transformedValue === "true";
      break;
    case "date":
      filters[fieldName] = new Date(transformedValue);
      break;
    case "dateRange":
      // Date range is handled separately in handleDateRangeFilter
      break;
    case "array":
      const values = Array.isArray(transformedValue)
        ? transformedValue
        : transformedValue.split(",");
      filters[fieldName] = { in: values };
      break;
  }
}

/**
 * Builds query options from request parameters
 * @throws {AppError} If query parameters are invalid
 */
export function buildQueryOptions(
  queryParams: Record<string, any>,
  filterConfig: Record<string, FilterConfig> = {},
  sortConfig: Record<string, SortConfig> = {},
  defaultSort?: Record<string, "asc" | "desc">
): QueryOptions {
  try {
    const page = parseInt(queryParams.page) || DEFAULT_PAGE;
    const count = parseInt(queryParams.count) || DEFAULT_PAGE_SIZE;
    validatePaginationParams(page, count);

    // Handle sorting
    let orderBy: Record<string, "asc" | "desc"> | undefined;

    if (queryParams.sortBy) {
      const sortByArray = Array.isArray(queryParams.sortBy)
        ? queryParams.sortBy
        : queryParams.sortBy.split(",");

      const sortOrderArray = queryParams.sortOrder
        ? Array.isArray(queryParams.sortOrder)
          ? queryParams.sortOrder
          : queryParams.sortOrder.split(",")
        : Array(sortByArray.length).fill("asc");

      if (sortByArray.length !== sortOrderArray.length) {
        throw new AppError(
          ErrorCode.INVALID_INPUT,
          `Sort fields (${sortByArray.length}) and orders (${sortOrderArray.length}) must have the same length`
        );
      }

      const sortBy: string[] = [];
      const sortOrder: ("asc" | "desc")[] = [];

      sortByArray.forEach((field: string, index: number) => {
        const order = sortOrderArray[index].toLowerCase();
        validateSortOrder(order);
        sortBy.push(field);
        sortOrder.push(order);
      });

      orderBy = convertToPrismaOrderBy(sortBy, sortOrder);
    } else if (defaultSort) {
      const [defaultField, defaultDirection] = Object.entries(defaultSort)[0];
      orderBy = { [defaultField]: defaultDirection };
    }

    // Handle filters
    const filters: Record<string, any> = {};

    // Handle date range filters first
    handleDateRangeFilter(queryParams, filters, filterConfig);

    // Handle other filters
    Object.entries(filterConfig).forEach(([key, config]) => {
      if (config.type !== "dateRange") {
        const value = queryParams[key];
        if (value === undefined) return;
        applyFilter(key, value, config, filters);
      }
    });

    return {
      page,
      count,
      filters,
      ...(orderBy && { orderBy }),
    };
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      `Failed to build query options: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
