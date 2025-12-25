import { NewsletterSubscriber } from "./newsletter-subscriber.entity";

export interface NewsletterRepository {
  findByEmail(email: string): Promise<NewsletterSubscriber | null>;
  save(subscriber: NewsletterSubscriber): Promise<void>;
  findAllSubscribed(): Promise<NewsletterSubscriber[]>;
}
