import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizEntity } from '../../entities/quiz.entity';
import { QuestionEntity } from '../../entities/question.entity';
import { OptionEntity } from '../../entities/option.entity';
import { QuizSubmissionEntity } from '../../entities/quiz-submission.entity';
import { StudentAnswerEntity } from '../../entities/student-answer.entity';
import { CourseEntity } from '../../entities/course.entity';
import { StudentEntity } from '../../entities/student.entity';
import { CategoryEntity } from '../../entities/category.entity';
import { QuizSettingsEntity } from '../../entities/quiz-settings.entity';
import { MediaAttachmentEntity } from '../../entities/media-attachment.entity';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizEntity,
      QuestionEntity,
      OptionEntity,
      QuizSubmissionEntity,
      StudentAnswerEntity,
      CourseEntity,
      StudentEntity,
      CategoryEntity,
      QuizSettingsEntity,
      MediaAttachmentEntity,
    ]),
    AuthModule,
  ],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {}
