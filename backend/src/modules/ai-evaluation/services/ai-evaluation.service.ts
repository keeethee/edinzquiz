import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EvaluationQueueService } from './evaluation-queue.service';

@Injectable()
export class AiEvaluationService {
  constructor(
    private prisma: PrismaService,
    private evaluationQueueService: EvaluationQueueService,
  ) {}

  /**
   * Enqueues an assignment submission for asynchronous AI evaluation.
   */
  async triggerAsyncEvaluation(submissionId: string): Promise<void> {
    await this.evaluationQueueService.enqueueSubmission(submissionId);
  }

  /**
   * Manually triggers or retries an evaluation for a submission.
   */
  async retryEvaluation(submissionId: string): Promise<any> {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    // Re-enqueue job
    await this.triggerAsyncEvaluation(submissionId);
    return {
      message: 'AI Evaluation re-queued successfully',
      submissionId,
      status: 'QUEUED',
    };
  }

  /**
   * Admin accepts or overrides the AI recommendation and publishes the final grade to the student.
   */
  async overrideAndPublish(
    submissionId: string,
    marks: number,
    feedback: string,
    overrideComment?: string,
  ): Promise<any> {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        evaluations: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    const latestEval = submission.evaluations[0];
    const isOverride = latestEval ? latestEval.recommendedMarks !== marks : true;

    const updatedSubmission = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks: parseFloat(marks as any),
        feedback,
        currentStatus: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        assignment: { include: { course: true } },
        evaluations: { orderBy: { version: 'desc' } },
      },
    });

    return {
      message: 'Assignment grade published successfully to student portal',
      submission: updatedSubmission,
      isOverride,
      overrideComment: overrideComment || null,
    };
  }

  /**
   * Retrieves full AI evaluation history and latest details for a submission.
   */
  async getEvaluationDetail(submissionId: string): Promise<any> {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true } },
        evaluations: { orderBy: { version: 'desc' } },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    const latestEvaluation = submission.evaluations[0] || null;

    return {
      submissionId: submission.id,
      fileName: submission.fileName,
      fileUrl: submission.fileUrl,
      fileType: submission.fileType,
      currentStatus: submission.currentStatus,
      submittedAt: submission.submittedAt,
      publishedAt: submission.publishedAt,
      marks: submission.marks,
      feedback: submission.feedback,
      assignment: submission.assignment,
      latestEvaluation,
      evaluationHistory: submission.evaluations,
    };
  }
}
