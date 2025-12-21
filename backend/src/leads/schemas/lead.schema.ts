import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LeadDocument = Lead & Document;

export type LeadPicture = {
  key: string;
  mimeType: string;
  originalName: string;
};

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

  @Prop({
    type: [
      {
        key: { type: String, required: true },
        mimeType: { type: String, required: true },
        originalName: { type: String, required: true },
      },
    ],
    default: [],
  })
  pictures: LeadPicture[];
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
