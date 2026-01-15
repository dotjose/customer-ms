import { IEvent } from "@nestjs/cqrs";

export class NewsletterSubscribedEvent implements IEvent {
  constructor(
    public readonly email: string
  ) {}
}
