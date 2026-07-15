import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentEntity, AssignmentSchema } from '../../entities/assignment.entity';
import { AssignmentSubmissionEntity, AssignmentSubmissionSchema } from '../../entities/assignment-submission.entity';
import { CourseEntity, CourseSchema } from '../../entities/course.entity';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssignmentEntity.name, schema: AssignmentSchema },
      { name: AssignmentSubmissionEntity.name, schema: AssignmentSubmissionSchema },
      { name: CourseEntity.name, schema: CourseSchema },
    ]),
    AuthModule,
  ],
  providers: [AssignmentService],
  controllers: [AssignmentController],
  exports: [AssignmentService],
})
export class AssignmentModule {}
