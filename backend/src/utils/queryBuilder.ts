import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { DateTime } from "luxon";

// Constants
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

type FilterConfig = {
  type: "string" | "number" | "boolean" | "date" | "dateRange" | "array";
  from?: string;
  to?: string;
  field?: string;
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
  list: T[];
  pagination: Pagination;
};

/**
 * Builds pagination metadata
 * @throws {AppError} If pagination parameters are invalid
 */
export function buildPagination(
  total: number,
  page: number,
  count: number
): Pagination {
  return {
    total,
    page,
    count,
    totalPages: Math.ceil(total / count),
  };
}

/**
 * Parses date string into DateTime object
 * Supports both MM/DD/YYYY and ISO format
 */
function parseDate(dateStr: string): DateTime {
  if (dateStr.includes("/")) {
    const [month, day, year] = dateStr.split("/");
    return DateTime.fromObject({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
    });
  }
  return DateTime.fromISO(dateStr);
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
          const fromDate = parseDate(fromValue).startOf("day").toJSDate();
          filters[fieldName].gte = fromDate;
        }

        if (toValue) {
          const toDate = parseDate(toValue).endOf("day").toJSDate();
          filters[fieldName].lte = toDate;
        }
      }
    }
  });
}

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

  switch (config.type) {
    case "string":
      filters[fieldName] = value;
      break;
    case "number":
      filters[fieldName] = Number(value);
      break;
    case "boolean":
      filters[fieldName] = value === "true";
      break;
    case "date":
      filters[fieldName] = DateTime.fromISO(value).toJSDate();
      break;
    case "dateRange":
      // Date range is handled separately in handleDateRangeFilter
      break;
    case "array":
      const values = Array.isArray(value) ? value : value.split(",");
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
  searchFields?: string[]
): QueryOptions {
  try {
    const page = parseInt(queryParams.page) || DEFAULT_PAGE;
    const count = parseInt(queryParams.count) || DEFAULT_PAGE_SIZE;

    // Handle sorting
    let orderBy: Record<string, "asc" | "desc"> | undefined;

    if (queryParams.sortBy) {
      const sortField = queryParams.sortBy;
      const sortOrder = queryParams.sortOrder.toLowerCase();

      orderBy = { [sortField]: sortOrder };
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

    // Handle multi-column search
    if (
      searchFields &&
      queryParams.search &&
      queryParams.search.trim() !== ""
    ) {
      const search = queryParams.search.trim();
      filters.OR = searchFields.map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      }));
    }

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
