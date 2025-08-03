import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SocialLink } from "domain/user/user.entity";
import { Document } from "mongoose";

@Schema({
  timestamps: true,
  collection: "users",
})
export class UserDocument extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: [String], default: ["USER"] })
  roles: string[];

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: (value: number[]) => {
          return (
            Array.isArray(value) && value.length === 2 && !value.includes(NaN)
          );
        },
        message:
          "Coordinates must contain exactly 2 valid numbers (latitude and longitude)",
      },
    },
  })
  location?: {
    type?: "Point";
    coordinates?: [number, number];
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  @Prop()
  socialLinks?: SocialLink[];

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

// Apply the 2dsphere index only for documents where `location` and `coordinates` are valid
UserSchema.index(
  { location: "2dsphere" },
  {
    partialFilterExpression: {
      location: { $exists: true }, // Ensure location exists
      "location.type": "Point", // Ensure the type is Point
      "location.coordinates": { $exists: true, $type: "array" }, // Ensure coordinates exist and are an array
    },
    background: true,
  }
);

// Create indexes for other fields
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phoneNumber: 1 }, { unique: true });
UserSchema.index({ roles: 1 });
UserSchema.index({ isVerified: 1 });
