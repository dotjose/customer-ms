import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetSubscriberByTokenQuery, GetSubscriberPreferencesQuery } from "../newsletter.queries";
import { NewsletterRepository } from "domain/newsletter/newsletter.repository";
import { NewsletterTokenService, NewsletterTokenType } from "infrastructure/services/newsletter-token.service";
import { NewsletterSubscriber } from "domain/newsletter/newsletter-subscriber.entity";

@QueryHandler(GetSubscriberByTokenQuery)
export class GetSubscriberByTokenHandler implements IQueryHandler<GetSubscriberByTokenQuery> {
  constructor(
    @Inject("NewsletterRepository")
    private readonly repository: NewsletterRepository,
    private readonly tokenService: NewsletterTokenService
  ) {}

  async execute(query: GetSubscriberByTokenQuery): Promise<NewsletterSubscriber | null> {
    try {
      const email = await this.tokenService.verifyToken(query.token, NewsletterTokenType.PREFERENCES);
      return this.repository.findByEmail(email);
    } catch (error) {
      return null;
    }
  }
}

@QueryHandler(GetSubscriberPreferencesQuery)
export class GetSubscriberPreferencesHandler implements IQueryHandler<GetSubscriberPreferencesQuery> {
  constructor(
    @Inject("NewsletterRepository")
    private readonly repository: NewsletterRepository
  ) {}

  async execute(query: GetSubscriberPreferencesQuery): Promise<NewsletterSubscriber | null> {
    return this.repository.findByEmail(query.email);
  }
}
