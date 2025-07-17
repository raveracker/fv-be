// website.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebsiteDocument = Website & Document;

@Schema({ timestamps: true })
export class Website {
  @Prop({ required: true, unique: true })
  url: string;

  @Prop({ default: false })
  isScam: boolean;

  @Prop({ type: String })
  riskFactor: string;

  @Prop({ type: Number, min: 0, max: 10, default: 0 })
  rating: number;

  @Prop({ required: true })
  productOrService: string;

  @Prop({ required: true })
  businessCategory: string;

  @Prop()
  targetAudience: string;

  @Prop()
  summary: string;
}

export const WebsiteSchema = SchemaFactory.createForClass(Website);
