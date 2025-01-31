import { IEvent } from "@nestjs/cqrs";
import { ObjectId } from "mongodb";

export class UserRegisteredEvent implements IEvent {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string
  ) {}
}
