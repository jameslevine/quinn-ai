// API Types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTEGRATION_ERROR"
  | "INTERNAL_ERROR";

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export interface Pagination {
  limit: number;
  offset?: number;
  total?: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}
