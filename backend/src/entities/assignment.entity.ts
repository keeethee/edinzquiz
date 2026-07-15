import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CourseEntity } from './course.entity';

export type AssignmentDocument = AssignmentEntity & Document;

@Schema({ collection: 'assignments', timestamps: true })
export class AssignmentEntity {
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, default: null })
  description: string | null;

  @Prop({ required: true })
  deadline: Date;

  @Prop({ type: Types.ObjectId, ref: 'CourseEntity', required: true, index: true })
  course: CourseEntity | string;
}

export const AssignmentSchema = SchemaFactory.createForClass(AssignmentEntity);
