import { IQuery } from '@nestjs/cqrs';

export interface GetPaginatedReviewsParams {
  consultantId: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export class GetPaginatedReviewsQuery implements IQuery {
  constructor(public readonly params: GetPaginatedReviewsParams) {}
}