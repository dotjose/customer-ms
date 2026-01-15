import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { SubscribeNewsletterCommand, UnsubscribeNewsletterCommand, UpdateNewsletterPreferencesCommand } from "../newsletter.commands";
import { NewsletterRepository } from "domain/newsletter/newsletter.repository";
import { NewsletterSubscriber } from "domain/newsletter/newsletter-subscriber.entity";
import { NewsletterSubscribedEvent } from "application/events/user/newsletter.event";

@CommandHandler(SubscribeNewsletterCommand)
export class SubscribeNewsletterHandler
  implements ICommandHandler<SubscribeNewsletterCommand>
{
  constructor(
    @Inject("NewsletterRepository")
    private readonly repository: NewsletterRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: SubscribeNewsletterCommand): Promise<void> {
    const { email } = command;

    const existing = await this.repository.findByEmail(email);

    // Already subscribed → do nothing
    if (existing && existing.status === "SUBSCRIBED") {
      return;
    }

    // New subscriber
    let subscriber: NewsletterSubscriber;

    if (existing) {
      existing.subscribe();
      subscriber = existing;
    } else {
      subscriber = NewsletterSubscriber.create(email);
    }

    await this.repository.save(subscriber);

    // 🔥 Publish ONLY for new subscribers
    if (!existing) {
      this.eventBus.publish(
        new NewsletterSubscribedEvent(email)
      );
    }
  }
}

@CommandHandler(UnsubscribeNewsletterCommand)
export class UnsubscribeNewsletterHandler implements ICommandHandler<UnsubscribeNewsletterCommand> {
  constructor(
    @Inject("NewsletterRepository")
    private readonly repository: NewsletterRepository
  ) {}

  async execute(command: UnsubscribeNewsletterCommand): Promise<void> {
    const { email } = command;
    const subscriber = await this.repository.findByEmail(email);

    if (subscriber) {
      subscriber.unsubscribe();
      await this.repository.save(subscriber);
    }
  }
}

@CommandHandler(UpdateNewsletterPreferencesCommand)
export class UpdateNewsletterPreferencesHandler implements ICommandHandler<UpdateNewsletterPreferencesCommand> {
  constructor(
    @Inject("NewsletterRepository")
    private readonly repository: NewsletterRepository
  ) {}

  async execute(command: UpdateNewsletterPreferencesCommand): Promise<void> {
    const { email, preferences } = command;
    const subscriber = await this.repository.findByEmail(email);

    if (subscriber) {
      subscriber.updatePreferences(preferences);
      await this.repository.save(subscriber);
    }
  }
}
