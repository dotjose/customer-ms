import { IEvent } from '@nestjs/cqrs';
import { ObjectId } from 'mongodb';

export class ConsultantProfileCreatedEvent implements IEvent {
  constructor(
    public readonly consultantId: ObjectId,
    public readonly userId: ObjectId,
    public readonly profession: string,
  ) {}
}