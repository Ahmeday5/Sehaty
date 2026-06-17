export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
