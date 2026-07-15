import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CourseEntity } from './course.entity';
import { CategoryEntity } from './category.entity';
import { QuizSettingsSchema, QuizSettingsEntity } from './quiz-settings.entity';
import { QuestionSchema, QuestionEntity } from './question.entity';

export type QuizDocument = QuizEntity & Document;

@Schema({ collection: 'quizzes', timestamps: true })
export class QuizEntity {
  _id: string;

  @Prop({ required: true })
  quizTitle: string;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ default: 'Medium' })
  difficulty: string; // 'Easy' | 'Medium' | 'Hard'

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ default: 'Draft' })
  status: string; // 'Draft' | 'Published' | 'Archived'

  @Prop({ default: 100 })
  totalMarks: number;

  @Prop({ default: 60 })
  duration: number; // in minutes

  @Prop({ default: 40 })
  passingMarks: number;

  @Prop({ default: false })
  negativeMarkingEnabled: boolean;

  @Prop({ default: 0 })
  negativeMarkingValue: number;

  @Prop({ default: false })
  shuffleQuestions: boolean;

  @Prop({ default: false })
  shuffleOptions: boolean;

  @Prop({ default: false })
  resultsPublished: boolean;

  @Prop({ type: Types.ObjectId, ref: 'CourseEntity', required: true, index: true })
  course: CourseEntity | string; // Reference to Course

  @Prop({ type: Types.ObjectId, ref: 'CategoryEntity', default: null, index: true })
  category: CategoryEntity | null | string; // Reference to Category

  @Prop({ type: QuizSettingsSchema, default: () => ({}) })
  settings: QuizSettingsEntity;

  @Prop({ type: [QuestionSchema], default: [] })
  questions: QuestionEntity[];
}

export const QuizSchema = SchemaFactory.createForClass(QuizEntity);
