import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ _id: false })
class NewsletterPreferencesSchema {
  @Prop({ default: true })
  products: boolean;

  @Prop({ default: true })
  jobs: boolean;

  @Prop({ default: true })
  professionals: boolean;

  @Prop({ default: true })
  events: boolean;

  @Prop({ default: true })
  realestate: boolean;

  @Prop({ default: 'MONTHLY' })
  frequency: string;
}

@Schema({ collection: "newsletter_subscribers", timestamps: true })
export class NewsletterSubscriberDocument extends Document {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, enum: ["SUBSCRIBED", "UNSUBSCRIBED"], default: "SUBSCRIBED" })
  status: string;

  @Prop({ type: NewsletterPreferencesSchema, default: () => ({}) })
  preferences: NewsletterPreferencesSchema;

  @Prop()
  unsubscribedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const NewsletterSubscriberSchema = SchemaFactory.createForClass(NewsletterSubscriberDocument);
