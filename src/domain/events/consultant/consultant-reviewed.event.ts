import { IEvent } from "@nestjs/cqrs";
import { ObjectId } from "mongodb";

export class ConsultantReviewedEvent implements IEvent {
  constructor(
    public readonly consultantId: string,
    public readonly review: {
      userId: ObjectId;
      userName: string;
      rating: number;
      review: string;
      createdAt: Date;
    }
  ) {}
}
