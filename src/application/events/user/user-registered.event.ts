import { IEvent } from "@nestjs/cqrs";

export class UserRegisteredEvent implements IEvent {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly userId: string
  ) {}
}
