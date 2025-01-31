import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AddConsultantReviewCommand } from "../create-review.command";
import { ConsultantRepository } from "domain/consultant/consultant.repository";
import { ObjectId } from "mongodb";
import {
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { Consultant } from "domain/consultant/consultant.entity";

@CommandHandler(AddConsultantReviewCommand)
export class AddConsultantReviewHandler
  implements ICommandHandler<AddConsultantReviewCommand>
{
  private readonly logger = new Logger(AddConsultantReviewHandler.name);

  constructor(
    @Inject("ConsultantRepository")
    private readonly consultantRepository: ConsultantRepository
  ) {}

  async execute(command: AddConsultantReviewCommand): Promise<void> {
    const { consultantId, userId, userName, rating, review } = command;

    this.logger.log(
      `Processing AddConsultantReviewCommand for Consultant ID: ${consultantId}`
    );

    const consultant = await this.consultantRepository.findById(consultantId);

    this.validateReview(consultant, consultantId, userId);

    const newReview = {
      userId: new ObjectId(userId),
      userName,
      rating,
      review,
      createdAt: new Date(),
    };

    consultant.addReview(newReview);
    this.logger.log(
      `Added new review for Consultant ID: ${consultantId} by User ID: ${userId}`
    );

    try {
      await this.consultantRepository.save(consultant);
      this.logger.log(
        `Successfully saved updated Consultant ID: ${consultantId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save updated Consultant ID: ${consultantId} due to error: ${error.message}`,
        { userId, consultantId, stack: error.stack }
      );
      throw error;
    }
  }

  private validateReview(
    consultant: Consultant,
    consultantId: string,
    userId: string
  ): void {
    if (!consultant) {
      throw new NotFoundException(
        `Consultant with ID ${consultantId} not found`
      );
    }

    if (consultantId === userId) {
      throw new BadRequestException("You can't review yourself");
    }

    if (
      consultant.reviews.some((r) => r.userId.toString() === userId.toString())
    ) {
      throw new BadRequestException(
        "User has already reviewed this consultant"
      );
    }
  }
}
