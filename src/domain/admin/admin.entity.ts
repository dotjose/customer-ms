import { AggregateRoot } from "@nestjs/cqrs";
import { ObjectId } from "mongodb";
import { UserRole, UserStatus } from "../user/user.entity";

export interface AdminProps {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole; // Should always be ADMIN
  status: UserStatus;
  isSystemUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Admin extends AggregateRoot {
  private readonly _id: ObjectId;
  private readonly props: AdminProps;

  constructor(props: AdminProps, id?: ObjectId) {
    super();
    this._id = id || new ObjectId();
    this.props = {
      ...props,
      role: props.role || "ADMIN",
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

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get isSystemUser(): boolean {
    return this.props.isSystemUser;
  }

  public updateProfile(firstName: string, lastName: string, phoneNumber: string): void {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
    this.props.phoneNumber = phoneNumber;
    this.props.updatedAt = new Date();
  }

  public canBeDeleted(): boolean {
    return !this.props.isSystemUser;
  }

  public toObject() {
    return {
      _id: this._id,
      ...this.props,
    };
  }
}
