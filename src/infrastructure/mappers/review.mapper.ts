import { Review } from "domain/consultant/consultant.entity";
import { ReviewDTO } from "presentation/dtos/review.dto";

export class ReviewMapper {
  static toDTO(review: Review): ReviewDTO {
    return {
      userId: review.userId.toString(),
      userName: review.userName,
      rating: review.rating,
      review: review.review,
      createdAt: review.createdAt,
    };
  }
}
