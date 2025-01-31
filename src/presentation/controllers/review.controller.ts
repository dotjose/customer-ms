import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { GetPaginatedReviewsQuery } from "application/queries/reviews/get-paginated-reviews.query";
import { AddConsultantReviewCommand } from "application/commands/review/create-review.command";
import { CreateReviewDto } from "../dtos/review.dto";

@ApiTags("Reviews")
@Controller("reviews")
export class ReviewController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get("consultant/:consultantId")
  @ApiOperation({ summary: "Get paginated reviews for a consultant" })
  @ApiResponse({
    status: 200,
    description: "Returns paginated reviews with AI summary",
  })
  async getPaginatedReviews(
    @Param("consultantId") consultantId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: "date" | "rating",
    @Query("sortOrder") sortOrder?: "asc" | "desc"
  ) {
    const query = new GetPaginatedReviewsQuery({
      consultantId,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return this.queryBus.execute(query);
  }

  @Post("consultant")
  @ApiOperation({ summary: "Create a review for a consultant" })
  @ApiResponse({ status: 201, description: "Review created successfully" })
  async createReview(@Body() dto: CreateReviewDto) {
    const command = new AddConsultantReviewCommand(
      dto.consultantId,
      dto.userId,
      dto.userName,
      dto.rating,
      dto.review
    );
    return this.commandBus.execute(command);
  }
}
