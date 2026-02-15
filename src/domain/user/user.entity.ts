import { AggregateRoot } from "@nestjs/cqrs";
import { ObjectId } from "mongodb";

export type UserRole = "USER" | "CREATOR" | "CONSULTANT" | "ADMIN";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  BANNED = "BANNED",
  BLOCKED = "BLOCKED",
}

export interface SocialLink {
  platform:
  | "facebook"
  | "twitter"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "whatsapp"
  | "telegram";
  url: string;
}

export interface UserProps {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  status: UserStatus;
  isSystemUser: boolean;
  isVerified: boolean;
  phoneNumber: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  avatar?: string;
  location?: {
    type?: "Point";
    coordinates?: [number, number]; // [longitude, latitude]
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  bio?: string;
  socialLinks?: SocialLink[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private readonly _id: ObjectId;
  private readonly props: UserProps;

  constructor(props: UserProps, id?: ObjectId) {
    super();
    this._id = id || new ObjectId();
    this.props = {
      ...props,
      status: props.status || UserStatus.ACTIVE,
      isSystemUser: props.isSystemUser || false,
    };
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

  get status(): UserStatus {
    return this.props.status;
  }

  get isSystemUser(): boolean {
    return this.props.isSystemUser;
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

  get lastLogin(): Date {
    return this.props.lastLogin;
  }

  public verify(): void {
    this.props.isVerified = true;
    this.props.updatedAt = new Date();
    // You can emit domain events here
    // this.apply(new UserVerifiedEvent(this.id));
  }

  public markLoggedIn(): void {
    this.props.lastLogin = new Date();
    this.props.updatedAt = new Date();
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
    this.props.passwordResetExpires = new Date(
      new Date().getTime() + 1 * 60 * 60 * 1000
    );
  }

  public updateLocation(
    longitude: number,
    latitude: number,
    address: string,
    city?: string,
    state?: string,
    country?: string
  ): void {
    this.props.location = {
      type: "Point",
      coordinates: [longitude, latitude],
      address,
      city,
      state,
      country,
    };
    this.props.updatedAt = new Date();
    // this.apply(new UserLocationUpdatedEvent(this.id, this.props.location));
  }

  public updatePassword(newPassword: string) {
    this.props.password = newPassword;
    this.props.passwordResetExpires = null;
    this.props.passwordResetToken = null;
  }

  public activate(): void {
    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  public suspend(): void {
    this.ensureNotSystemUser();
    this.props.status = UserStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  public ban(): void {
    this.ensureNotSystemUser();
    this.props.status = UserStatus.BANNED;
    this.props.updatedAt = new Date();
  }

  public block(): void {
    this.ensureNotSystemUser();
    this.props.status = UserStatus.BLOCKED;
    this.props.updatedAt = new Date();
  }

  private ensureNotSystemUser(): void {
    if (this.props.isSystemUser) {
      throw new Error("System users cannot be blocked, banned, or suspended.");
    }
  }

  public canBeDeleted(): boolean {
    return !this.props.isSystemUser;
  }

  public toObject() {
    return {
      _id: this._id?.toString(),
      ...this.props,
    };
  }
}
