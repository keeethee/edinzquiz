import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QuizEntity } from './quiz.entity';
import { StudentEntity } from './student.entity';
import { StudentAnswerSchema, StudentAnswerEntity } from './student-answer.entity';

export type QuizSubmissionDocument = QuizSubmissionEntity & Document;

@Schema({ collection: 'quiz_submissions', timestamps: true })
export class QuizSubmissionEntity {
  _id: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  collegeName: string;

  @Prop({ required: true })
  courseId: string; // e.g. 'CS-101'

  @Prop({ required: true })
  courseName: string;

  @Prop({ type: Number, default: 0 })
  score: number;

  @Prop({ required: true })
  totalMarks: number;

  @Prop({ type: Number, default: 0 })
  percentage: number;

  @Prop({ default: 0 })
  correctCount: number;

  @Prop({ default: 0 })
  wrongCount: number;

  @Prop({ default: 0 })
  unansweredCount: number;

  @Prop({ default: 'Pending Evaluation' })
  status: string; // 'Pass' | 'Fail' | 'Pending Evaluation'

  @Prop({ default: 0 })
  timeTakenSeconds: number;

  @Prop({ default: '' })
  grade: string;

  @Prop({ default: Date.now })
  submittedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'QuizEntity', required: true, index: true })
  quiz: QuizEntity | string;

  @Prop({ type: Types.ObjectId, ref: 'StudentEntity', default: null, index: true })
  student: StudentEntity | null | string;

  @Prop({ type: [StudentAnswerSchema], default: [] })
  studentAnswers: StudentAnswerEntity[];
}

export const QuizSubmissionSchema = SchemaFactory.createForClass(QuizSubmissionEntity);
