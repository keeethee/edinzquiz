import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentEntity } from '../../entities/assignment.entity';
import { AssignmentSubmissionEntity } from '../../entities/assignment-submission.entity';
import { CourseEntity } from '../../entities/course.entity';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssignmentEntity, AssignmentSubmissionEntity, CourseEntity]),
    AuthModule,
  ],
  providers: [AssignmentService],
  controllers: [AssignmentController],
  exports: [AssignmentService],
})
export class AssignmentModule {}
