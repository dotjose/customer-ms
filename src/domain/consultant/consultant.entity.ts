import { AggregateRoot } from "@nestjs/cqrs";
import { ConsultantAIReviewUpdatedEvent } from "domain/events/consultant/consultant-ai-reviewed.event";
import { ConsultantReviewedEvent } from "domain/events/consultant/consultant-reviewed.event";
import { ObjectId } from "mongodb";

interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
}

interface Experience {
  company: string;
  position: string;
  description: string;
  startDate: Date;
  endDate?: Date;
}

export interface Review {
  userId: ObjectId;
  userName: string;
  rating: number; // 1-5
  review: string;
  createdAt: Date;
}

interface AIReview {
  rating: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface ConsultantProps {
  userId: ObjectId;
  profession: ObjectId;
  skills: string[];
  education: Education[];
  experience: Experience[];
  hourlyRate: number;
  resumeUrl?: string;
  avatarUrl?: string;
  reviews: Review[];
  aiReview?: AIReview;
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Consultant extends AggregateRoot {
  private readonly _id: ObjectId;
  private readonly props: ConsultantProps;

  constructor(props: ConsultantProps, id?: ObjectId) {
    super();
    this._id = id || new ObjectId();
    this.props = props;
  }

  get id(): ObjectId {
    return this._id;
  }

  get userId(): ObjectId {
    return this.props.userId;
  }

  get profession(): ObjectId {
    return this.props.profession;
  }

  get skills(): string[] {
    return this.props.skills;
  }

  get hourlyRate(): number {
    return this.props.hourlyRate;
  }

  get reviews(): Review[] {
    return this.props.reviews;
  }

  get aiReview(): AIReview | undefined {
    return this.props.aiReview;
  }

  get averageRating(): number {
    return this.props.averageRating;
  }

  public addReview(review: Review): void {
    this.props.reviews.push(review);
    this.updateAverageRating();
    this.props.updatedAt = new Date();
    this.apply(new ConsultantReviewedEvent(this.id.toString(), review));
  }

  public updateAIReview(aiReview: AIReview): void {
    this.props.aiReview = aiReview;
    this.props.updatedAt = new Date();
    this.apply(
      new ConsultantAIReviewUpdatedEvent(this.id.toString(), aiReview)
    );
  }

  private updateAverageRating(): void {
    const totalRating = this.props.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    this.props.averageRating = totalRating / this.props.reviews.length;
    this.props.totalReviews = this.props.reviews.length;
  }

  public updateProfile(update: Partial<ConsultantProps>): void {
    Object.assign(this.props, update);
    this.props.updatedAt = new Date();
  }

  public toObject() {
    return {
      _id: this._id,
      ...this.props,
    };
  }
}
