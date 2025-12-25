import { AggregateRoot } from "@nestjs/cqrs";
import { ObjectId } from "mongodb";
import { NewsletterPreferences } from "./newsletter-preferences.value-object";

export type NewsletterStatus = "SUBSCRIBED" | "UNSUBSCRIBED";

export interface NewsletterSubscriberProps {
  email: string;
  status: NewsletterStatus;
  preferences: NewsletterPreferences;
  createdAt: Date;
  updatedAt: Date;
  unsubscribedAt?: Date;
}

export class NewsletterSubscriber extends AggregateRoot {
  private readonly _id: ObjectId;
  private props: NewsletterSubscriberProps;

  constructor(props: NewsletterSubscriberProps, id?: ObjectId) {
    super();
    this._id = id || new ObjectId();
    this.props = props;
  }

  get id(): string {
    return this._id.toString();
  }

  get email(): string {
    return this.props.email;
  }

  get status(): NewsletterStatus {
    return this.props.status;
  }

  get preferences(): NewsletterPreferences {
    return this.props.preferences;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get unsubscribedAt(): Date | undefined {
    return this.props.unsubscribedAt;
  }

  public static create(email: string): NewsletterSubscriber {
    return new NewsletterSubscriber({
      email: email.toLowerCase().trim(),
      status: "SUBSCRIBED",
      preferences: NewsletterPreferences.createDefault(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public subscribe(): void {
    this.props.status = "SUBSCRIBED";
    this.props.unsubscribedAt = undefined;
    this.props.updatedAt = new Date();
  }

  public unsubscribe(): void {
    this.props.status = "UNSUBSCRIBED";
    this.props.unsubscribedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public updatePreferences(preferences: Partial<NewsletterPreferences>): void {
    this.props.preferences = {
      ...this.props.preferences,
      ...preferences,
      frequency: "MONTHLY", // Fixed for now
    };
    this.props.updatedAt = new Date();
  }

  public toObject() {
    return {
      _id: this._id,
      ...this.props,
    };
  }
}
