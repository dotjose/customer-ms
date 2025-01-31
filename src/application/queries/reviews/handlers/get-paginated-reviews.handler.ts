import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetPaginatedReviewsQuery } from "../get-paginated-reviews.query";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { RedisService } from "infrastructure/services/redis.service";
import { PaginationUtils } from "infrastructure/utils/pagination.utils";
import { ReviewMapper } from "infrastructure/mappers/review.mapper";
import { Inject, Logger } from "@nestjs/common";
import { AISummary } from "presentation/dtos/review.dto";

@QueryHandler(GetPaginatedReviewsQuery)
export class GetPaginatedReviewsHandler
  implements IQueryHandler<GetPaginatedReviewsQuery>
{
  private readonly logger = new Logger(GetPaginatedReviewsHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(query: GetPaginatedReviewsQuery) {
    this.logger.log(
      `Executing GetPaginatedReviewsQuery for consultantId: ${query.params.consultantId}`
    );

    const {
      consultantId,
      page = 1,
      limit = 20,
      sortBy = "date",
      sortOrder = "desc",
    } = query.params;
    const cacheKey = this.getCacheKey(
      consultantId,
      page,
      limit,
      sortBy,
      sortOrder
    );

    // Try fetching from cache
    const cachedResult = await this.redisService.get(cacheKey);
    if (cachedResult) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cachedResult);
    }

    // Cache miss: Proceed with data fetching and sorting
    this.logger.log(
      `Cache miss. Fetching reviews for consultantId: ${consultantId}`
    );
    const consultant = await this.consultantRepository.findById(consultantId);
    if (!consultant) {
      this.logger.warn(`Consultant not found for id: ${consultantId}`);
      return PaginationUtils.createPaginatedResponse([], page, limit, 0);
    }

    // Sorting the reviews
    const sortedReviews = this.sortReviews(
      consultant.reviews,
      sortBy,
      sortOrder
    );

    // Using PaginationUtils to paginate
    const result = this.createResponse(
      sortedReviews,
      consultant.reviews.length,
      consultant.aiReview,
      consultant.averageRating,
      limit,
      page
    );

    // Cache the result for subsequent requests
    await this.redisService.set(cacheKey, JSON.stringify(result), 300); // Cache for 5 minutes
    this.logger.log(`Results cached with key: ${cacheKey}`);

    return result;
  }

  private getCacheKey(
    consultantId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string
  ): string {
    return `reviews:${consultantId}:${page}:${limit}:${sortBy}:${sortOrder}`;
  }

  private sortReviews(
    reviews: any[],
    sortBy: string,
    sortOrder: string
  ): any[] {
    this.logger.debug(`Sorting reviews by ${sortBy} in ${sortOrder} order`);
    return [...reviews].sort((a, b) => {
      const compareValue =
        sortBy === "date"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : a.rating - b.rating;
      return sortOrder === "desc" ? -compareValue : compareValue;
    });
  }

  private createResponse(
    sortedReviews: any[],
    totalReviews: number,
    aiSummary: AISummary,
    averageRating: number,
    limit: number,
    page: number
  ): any {
    this.logger.debug(`Creating response with AI summary and average rating`);
    return {
      ...PaginationUtils.createPaginatedResponse(
        sortedReviews.map((review) => ReviewMapper.toDTO(review)),
        page,
        limit,
        totalReviews
      ),
      aiSummary,
      averageRating,
      ratingDescription: this.getRatingDescription(averageRating),
    };
  }

  private getRatingDescription(rating: number): string {
    this.logger.debug(`Determining rating description for rating: ${rating}`);
    if (rating >= 4.5) return "Exceptional";
    if (rating >= 4.0) return "Excellent";
    if (rating >= 3.5) return "Very Good";
    if (rating >= 3.0) return "Good";
    if (rating >= 2.5) return "Fair";
    return "Needs Improvement";
  }
}
