import { IEvent } from "@nestjs/cqrs";

export class VerificationCodeGeneratedEvent implements IEvent {
  constructor(
    public readonly email: string,
    public readonly phone: string,
    public readonly code: string,
    public readonly name: string
  ) {}
}
