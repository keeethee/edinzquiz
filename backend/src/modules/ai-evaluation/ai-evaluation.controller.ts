import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { AiEvaluationService } from './services/ai-evaluation.service';

@Controller('ai-evaluation')
export class AiEvaluationController {
  constructor(private readonly aiEvaluationService: AiEvaluationService) {}

  @Post('evaluate/:submissionId')
  async retryEvaluation(@Param('submissionId') submissionId: string) {
    return this.aiEvaluationService.retryEvaluation(submissionId);
  }

  @Post('publish/:submissionId')
  async publishGrade(
    @Param('submissionId') submissionId: string,
    @Body() body: { marks: number; feedback: string; overrideComment?: string },
  ) {
    return this.aiEvaluationService.overrideAndPublish(
      submissionId,
      body.marks,
      body.feedback,
      body.overrideComment,
    );
  }

  @Get('submission/:submissionId')
  async getEvaluationDetail(@Param('submissionId') submissionId: string) {
    return this.aiEvaluationService.getEvaluationDetail(submissionId);
  }
}
