import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class ProfessionDocument extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: String })
  icon?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: "ConsultantDocument" }] })
  consultants: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ProfessionSchema =
  SchemaFactory.createForClass(ProfessionDocument);

// Index for faster lookups
ProfessionSchema.index({ name: 1 });
ProfessionSchema.index({ isActive: 1 });
