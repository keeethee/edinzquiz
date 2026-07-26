import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { AuthModule } from '../auth/auth.module';
import { AiEvaluationModule } from '../ai-evaluation/ai-evaluation.module';

@Module({
  imports: [AuthModule, AiEvaluationModule],
  providers: [AssignmentService],
  controllers: [AssignmentController],
  exports: [AssignmentService],
})
export class AssignmentModule {}
