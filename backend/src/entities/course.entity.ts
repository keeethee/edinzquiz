import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseDocument = CourseEntity & Document;

@Schema({ collection: 'courses', timestamps: true })
export class CourseEntity {
  _id: string;

  @Prop({ required: true, unique: true })
  courseId: string; // e.g. 'CS-101' or '412'

  @Prop({ required: true })
  courseName: string;

  @Prop()
  duration: string;

  @Prop({ default: 'Active' })
  status: string; // 'Active' or 'Inactive'
}

export const CourseSchema = SchemaFactory.createForClass(CourseEntity);
