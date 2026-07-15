import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizEntity, QuizSchema } from '../../entities/quiz.entity';
import { QuizSubmissionEntity, QuizSubmissionSchema } from '../../entities/quiz-submission.entity';
import { CourseEntity, CourseSchema } from '../../entities/course.entity';
import { StudentEntity, StudentSchema } from '../../entities/student.entity';
import { CategoryEntity, CategorySchema } from '../../entities/category.entity';
import { MediaAttachmentEntity, MediaAttachmentSchema } from '../../entities/media-attachment.entity';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizEntity.name, schema: QuizSchema },
      { name: QuizSubmissionEntity.name, schema: QuizSubmissionSchema },
      { name: CourseEntity.name, schema: CourseSchema },
      { name: StudentEntity.name, schema: StudentSchema },
      { name: CategoryEntity.name, schema: CategorySchema },
      { name: MediaAttachmentEntity.name, schema: MediaAttachmentSchema },
    ]),
    AuthModule,
  ],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {}
