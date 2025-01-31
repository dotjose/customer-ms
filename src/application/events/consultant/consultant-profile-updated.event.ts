import { IEvent } from "@nestjs/cqrs";
import { ObjectId } from "mongodb";
import { CreateConsultantProfileDto } from "presentation/dtos/consultant.dto";

export class ConsultantProfileUpdatedEvent implements IEvent {
  constructor(
    public readonly consultantId: ObjectId,
    public readonly profile: CreateConsultantProfileDto
  ) {}
}
