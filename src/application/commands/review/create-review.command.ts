import { ICommand } from "@nestjs/cqrs";

export class AddConsultantReviewCommand implements ICommand {
  constructor(
    public readonly consultantId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly rating: number, // 1-5
    public readonly review: string
  ) {}
}
