import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = CategoryEntity & Document;

@Schema({ collection: 'categories', timestamps: true })
export class CategoryEntity {
  _id: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryEntity);
