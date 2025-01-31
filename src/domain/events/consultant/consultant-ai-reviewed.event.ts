import { IEvent } from "@nestjs/cqrs";

export class ConsultantAIReviewUpdatedEvent implements IEvent {
  constructor(
    public readonly consultantId: string,
    public readonly aiReview: {
      rating: number;
      summary: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      lastUpdated: Date;
    }
  ) {}
}
