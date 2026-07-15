import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class QuizSettingsEntity {
  @Prop({ default: 1 })
  maxAttempts: number;

  @Prop({ default: 40 })
  passingPercentage: number;

  @Prop({ default: true })
  showResultsImmediately: boolean;
}

export const QuizSettingsSchema = SchemaFactory.createForClass(QuizSettingsEntity);
