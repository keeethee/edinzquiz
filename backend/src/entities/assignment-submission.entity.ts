import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CourseEntity } from './course.entity';
import { AssignmentEntity } from './assignment.entity';

export type AssignmentSubmissionDocument = AssignmentSubmissionEntity & Document;

@Schema({ collection: 'assignment_submissions', timestamps: true })
export class AssignmentSubmissionEntity {
  _id: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  collegeName: string;

  @Prop({ required: true })
  courseName: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ default: Date.now })
  submittedAt: Date;

  @Prop({ type: Number, default: null })
  marks: number | null;

  @Prop({ type: String, default: null })
  feedback: string | null;

  @Prop({ type: Types.ObjectId, ref: 'CourseEntity', required: true, index: true })
  course: CourseEntity | string;

  @Prop({ type: Types.ObjectId, ref: 'AssignmentEntity', default: null, index: true })
  assignment: AssignmentEntity | null | string;
}

export const AssignmentSubmissionSchema = SchemaFactory.createForClass(AssignmentSubmissionEntity);
