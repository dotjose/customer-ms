import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NewsletterSubscriberDocument } from "../../persistence/mongodb/schemas/newsletter.schema";
import { NewsletterSubscriber } from "domain/newsletter/newsletter-subscriber.entity";
import { NewsletterRepository } from "domain/newsletter/newsletter.repository";
import { NewsletterPreferences } from "domain/newsletter/newsletter-preferences.value-object";

@Injectable()
export class MongoNewsletterRepository implements NewsletterRepository {
  constructor(
    @InjectModel(NewsletterSubscriberDocument.name)
    private readonly subscriberModel: Model<NewsletterSubscriberDocument>
  ) {}

  async findByEmail(email: string): Promise<NewsletterSubscriber | null> {
    const doc = await this.subscriberModel.findOne({ email: email.toLowerCase().trim() }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async save(subscriber: NewsletterSubscriber): Promise<void> {
    const obj = subscriber.toObject();
    await this.subscriberModel.findOneAndUpdate(
      { _id: obj._id },
      obj,
      { upsert: true, new: true }
    ).exec();
  }

  async findAllSubscribed(): Promise<NewsletterSubscriber[]> {
    const docs = await this.subscriberModel.find({ status: "SUBSCRIBED" }).exec();
    return docs.map(doc => this.toEntity(doc));
  }

  private toEntity(doc: NewsletterSubscriberDocument): NewsletterSubscriber {
    const obj = doc.toObject();
    return new NewsletterSubscriber(
      {
        email: obj.email,
        status: obj.status,
        preferences: new NewsletterPreferences(
          obj.preferences.products,
          obj.preferences.jobs,
          obj.preferences.professionals,
          obj.preferences.events,
          obj.preferences.realestate,
          obj.preferences.frequency
        ),
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
        unsubscribedAt: obj.unsubscribedAt,
      },
      obj._id
    );
  }
}
