import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class OptionEntity {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: string;

  @Prop({ required: true })
  optionText: string;

  @Prop({ default: false })
  isCorrect: boolean;
}

export const OptionSchema = SchemaFactory.createForClass(OptionEntity);
