import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";

@Schema({ _id: false })
class Education {
  @Prop({ required: true })
  institution: string;

  @Prop({ required: true })
  degree: string;

  @Prop({ required: true })
  field: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;
}

@Schema({ _id: false })
class Experience {
  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;
}

@Schema({ _id: false })
class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  review: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ _id: false })
class AIReview {
  @Prop({ required: true })
  rating: number;

  @Prop({ required: true })
  summary: string;

  @Prop({ type: [String], required: true })
  strengths: string[];

  @Prop({ type: [String], required: true })
  weaknesses: string[];

  @Prop({ type: [String], required: true })
  recommendations: string[];

  @Prop({ default: Date.now })
  lastUpdated: Date;
}

@Schema({
  timestamps: true,
  collection: "consultants",
})
export class ConsultantDocument extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: "User" })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "ProfessionDocument", required: true })
  profession: Types.ObjectId;

  @Prop({ type: [String], required: true })
  skills: string[];

  @Prop({ type: [Education], required: true })
  education: Education[];

  @Prop({ type: [Experience], required: true })
  experiences: Experience[];

  @Prop({ required: true })
  hourlyRate: number;

  @Prop()
  resumeUrl?: string;

  @Prop({ type: [Review], default: [] })
  reviews: Review[];

  @Prop({ type: AIReview })
  aiReview?: AIReview;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: true })
  isAvailable: boolean;
}

export const ConsultantSchema =
  SchemaFactory.createForClass(ConsultantDocument);

// Create indexes
ConsultantSchema.index({ userId: 1 }, { unique: true });
ConsultantSchema.index({ profession: 1 });
ConsultantSchema.index({ skills: 1 });
ConsultantSchema.index({ averageRating: -1 });
ConsultantSchema.index({ hourlyRate: 1 });
ConsultantSchema.index({ "locationDetails.coordinates": "2dsphere" });
ConsultantSchema.index(
  {
    profession: "text",
    skills: "text",
    bio: "text",
  },
  {
    weights: {
      profession: 10,
      skills: 5,
      bio: 1,
    },
  }
);
