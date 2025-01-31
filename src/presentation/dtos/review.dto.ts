import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, Min, Max } from "class-validator";

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  userName: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty()
  @IsString()
  review: string;

  @ApiProperty()
  @IsString()
  consultantId: string;
}

export class ReviewDTO {
  userId: string;
  userName: string;
  rating: number;
  review: string;
  createdAt: Date;
}

export class ReviewSummaryDTO {
  averageRating: number;
  ratingDescription: string;
  totalReviews: number;
  aiSummary?: AISummary;
}

export class AISummary {
  rating: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  lastUpdated: Date;
}
