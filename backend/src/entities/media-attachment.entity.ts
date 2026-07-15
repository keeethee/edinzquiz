import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MediaAttachmentDocument = MediaAttachmentEntity & Document;

@Schema({ collection: 'media_attachments', timestamps: true })
export class MediaAttachmentEntity {
  _id: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const MediaAttachmentSchema = SchemaFactory.createForClass(MediaAttachmentEntity);
