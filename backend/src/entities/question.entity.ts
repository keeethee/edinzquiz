import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OptionSchema, OptionEntity } from './option.entity';

@Schema()
export class QuestionEntity {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: string;

  @Prop({ required: true })
  questionText: string;

  @Prop({ default: 'MCQ' })
  questionType: string;

  @Prop({ default: 1 })
  mark: number;

  @Prop({ type: String, default: null })
  correctAnswerText: string | null;

  @Prop({ default: 0 })
  orderIndex: number;

  @Prop({ type: String, default: null })
  explanation: string | null;

  @Prop({ default: false })
  caseSensitive: boolean;

  @Prop({ type: String, default: null })
  sampleAnswer: string | null;

  @Prop({ type: [OptionSchema], default: [] })
  options: OptionEntity[];
}

export const QuestionSchema = SchemaFactory.createForClass(QuestionEntity);
