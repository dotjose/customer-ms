export interface PaginatedResponse<T> {
  reviews: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaginationUtils {
  static createPaginatedResponse<T>(
    reviews: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
