import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StudentDocument = StudentEntity & Document;

@Schema({ collection: 'students', timestamps: true })
export class StudentEntity {
  _id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  collegeName: string;

  @Prop({ default: Date.now })
  registeredAt: Date;
}

export const StudentSchema = SchemaFactory.createForClass(StudentEntity);
