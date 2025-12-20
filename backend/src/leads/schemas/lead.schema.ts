import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true, collection: 'leads' })
export class Lead {
  @Prop({ required: true })
  salutation: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: Boolean, required: false })
  newsletterSingleOptIn: boolean;

  @Prop({ type: String, required: false })
  imageUrl: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
