import { AggregateRoot } from "@nestjs/cqrs";
import { ObjectId } from "mongodb";

export type UserRole = "USER" | "CREATOR" | "CONSULTANT" | "ADMIN";

export interface SocialLink {
  platform:
    | "facebook"
    | "twitter"
    | "instagram"
    | "linkedin"
    | "youtube"
    | "tiktok";
  url: string;
}

export interface UserProps {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  isVerified: boolean;
  phoneNumber: string;
  passwordResetToken?: string;
  passwordResetExpires?: number;
  avatar?: string;
  location?: {
    type?: "Point";
    coordinates?: [number, number]; // [longitude, latitude]
    address?: string;
  };
  bio?: string;
  socialLinks?: SocialLink[];
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private readonly _id: ObjectId;
  private readonly props: UserProps;

  constructor(props: UserProps, id?: ObjectId) {
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

  get password(): string {
    return this.props.password;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get phoneNumber(): string {
    return this.props.phoneNumber;
  }

  get roles(): UserRole[] {
    return this.props.roles;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get location() {
    return this.props.location;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get avatar(): string {
    return this.props.avatar;
  }

  get socials(): SocialLink[] {
    return this.props.socialLinks;
  }

  get bio(): string {
    return this.props.bio;
  }

  public verify(): void {
    this.props.isVerified = true;
    this.props.updatedAt = new Date();
    // You can emit domain events here
    // this.apply(new UserVerifiedEvent(this.id));
  }

  public addRole(role: UserRole): void {
    if (!this.props.roles.includes(role)) {
      this.props.roles.push(role);
      this.props.updatedAt = new Date();
      // this.apply(new UserRoleAddedEvent(this.id, role));
    }
  }

  public setResetToken(tokenCode: string): void {
    this.props.passwordResetToken = tokenCode;
    this.props.passwordResetExpires = new Date().getHours() + 1;
  }

  public updateLocation(
    longitude: number,
    latitude: number,
    address: string
  ): void {
    this.props.location = {
      type: "Point",
      coordinates: [longitude, latitude],
      address,
    };
    this.props.updatedAt = new Date();
    // this.apply(new UserLocationUpdatedEvent(this.id, this.props.location));
  }

  public updatePassword(newPassword: string) {
    this.props.password = newPassword;
    this.props.passwordResetExpires = undefined;
    this.props.passwordResetToken = undefined;
  }

  public toObject() {
    return {
      _id: this._id?.toString(),
      ...this.props,
    };
  }
}
