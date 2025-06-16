export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ErrorResponse {
  success: false;
  data: null;
  message: string;
  error: {
    code: string;
    details?: {
      fields?: Record<string, string[]>;
      [key: string]: any;
    };
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Common response types
export type PaginatedResponse<T> = {
  list: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type DeleteResponse = {
  message: string;
};

export type UpdateResponse<T> = {
  message: string;
  data: T;
};
