import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { SubscribeNewsletterCommand, UnsubscribeNewsletterCommand, UpdateNewsletterPreferencesCommand } from "../newsletter.commands";
import { NewsletterRepository } from "domain/newsletter/newsletter.repository";
import { NewsletterSubscriber } from "domain/newsletter/newsletter-subscriber.entity";

@CommandHandler(SubscribeNewsletterCommand)
export class SubscribeNewsletterHandler implements ICommandHandler<SubscribeNewsletterCommand> {
  constructor(
    @Inject("NewsletterRepository")
    private readonly repository: NewsletterRepository
  ) {}

  async execute(command: SubscribeNewsletterCommand): Promise<void> {
    const { email } = command;
    let subscriber = await this.repository.findByEmail(email);

    if (subscriber) {
      subscriber.subscribe();
    } else {
      subscriber = NewsletterSubscriber.create(email);
    }

    await this.repository.save(subscriber);
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
