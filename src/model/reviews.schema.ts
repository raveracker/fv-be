// review.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Website } from './website.schema';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: Website.name,
    required: true,
  })
  websiteId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  link: string;

  @Prop()
  subject: string;

  @Prop({ type: Date, default: null })
  date: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
