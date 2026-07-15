import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { QuestionEntity, QuestionSchema } from './question.entity';
import { OptionEntity, OptionSchema } from './option.entity';

@Schema()
export class StudentAnswerEntity {
  _id?: string;

  @Prop({ default: false })
  isCorrect: boolean;

  @Prop({ type: String, default: null })
  typedAnswerText: string | null;

  @Prop({ type: Number, default: null })
  awardedMarks: number | null;

  @Prop({ type: QuestionSchema, required: true })
  question: QuestionEntity;

  @Prop({ type: OptionSchema, default: null })
  selectedOption: OptionEntity | null;
}

export const StudentAnswerSchema = SchemaFactory.createForClass(StudentAnswerEntity);
