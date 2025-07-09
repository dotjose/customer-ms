import { AggregateRoot } from "@nestjs/cqrs";
import { ObjectId } from "mongodb";

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
  business: string;
  about: string;
  skills?: string[];
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

  get reviews(): Review[] {
    return this.props.reviews;
  }

  get aiReview(): AIReview | undefined {
    return this.props.aiReview;
  }

  get averageRating(): number {
    return this.props.averageRating;
  }

  get about(): string {
    return this.props.about;
  }

  get business(): string {
    return this.props.business;
  }

  public addReview(review: Review): void {
    this.props.reviews.push(review);
    this.updateAverageRating();
    this.props.updatedAt = new Date();
  }

  public updateAIReview(aiReview: AIReview): void {
    this.props.aiReview = aiReview;
    this.props.updatedAt = new Date();
  }

  private updateAverageRating(): void {
    const totalRating = this.props.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const avg = totalRating / this.props.reviews.length;
    this.props.averageRating = Math.round(avg * 100) / 100;
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
