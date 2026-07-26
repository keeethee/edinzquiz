import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FileProcessingService } from './file-processing.service';
import { PromptBuilderService } from './prompt-builder.service';
import { OllamaService } from './ollama.service';
import { ResultParserService } from './result-parser.service';

@Injectable()
export class EvaluationQueueService implements OnModuleInit {
  private readonly logger = new Logger(EvaluationQueueService.name);
  private queue: string[] = [];
  private isProcessing = false;

  constructor(
    private prisma: PrismaService,
    private fileProcessingService: FileProcessingService,
    private promptBuilderService: PromptBuilderService,
    private ollamaService: OllamaService,
    private resultParserService: ResultParserService,
  ) {}

  async onModuleInit() {
    // Automatically recover and process any stuck PENDING, QUEUED, or PROCESSING submissions on server startup
    try {
      const stuckSubmissions = await this.prisma.assignmentSubmission.findMany({
        where: { currentStatus: { in: ['PENDING', 'QUEUED', 'PROCESSING'] } },
        select: { id: true },
      });
      if (stuckSubmissions.length > 0) {
        this.logger.log(`Recovering ${stuckSubmissions.length} pending/queued submissions for instant AI evaluation...`);
        for (const sub of stuckSubmissions) {
          this.enqueueSubmission(sub.id);
        }
      }
    } catch (e: any) {
      this.logger.warn(`Queue recovery note: ${e.message}`);
    }
  }

  /**
   * Adds a submission ID to the queue for background asynchronous evaluation.
   */
  async enqueueSubmission(submissionId: string): Promise<void> {
    // Update submission status to QUEUED in DB
    await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { currentStatus: 'QUEUED' },
    });

    this.queue.push(submissionId);
    this.logger.log(`Enqueued submission ${submissionId}. Queue length: ${this.queue.length}`);

    // Process next in queue asynchronously
    setImmediate(() => this.processNextInQueue());
  }

  private async processNextInQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const submissionId = this.queue.shift();

    if (!submissionId) {
      this.isProcessing = false;
      return;
    }

    try {
      await this.executeEvaluationJob(submissionId);
    } catch (err: any) {
      this.logger.error(`Error processing queued evaluation ${submissionId}: ${err.message}`, err.stack);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNextInQueue());
      }
    }
  }

  /**
   * Executes the full evaluation workflow for a single submission.
   */
  async executeEvaluationJob(submissionId: string): Promise<any> {
    this.logger.log(`Starting AI evaluation job for submission ${submissionId}...`);

    // 1. Fetch submission & assignment from DB
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) {
      this.logger.error(`Submission ${submissionId} not found in DB`);
      return;
    }

    // Update status to PROCESSING
    await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { currentStatus: 'PROCESSING' },
    });

    const assignment = submission.assignment;
    const maxMarks = assignment.maxMarks || 100;

    try {
      // 2. Extract or reuse cached extracted content
      let extractedText = submission.extractedText;
      let imageBase64List: string[] | undefined = undefined;
      let fileType = submission.fileType;

      if (!extractedText) {
        this.logger.log(`Extracting content for file: ${submission.fileName}`);
        const extracted = await this.fileProcessingService.extractContent(
          submission.fileUrl,
          submission.fileName,
        );
        extractedText = extracted.extractedText;
        fileType = extracted.fileType;
        imageBase64List = extracted.imageBase64List;

        // Cache extracted text in DB for fast retries!
        await this.prisma.assignmentSubmission.update({
          where: { id: submissionId },
          data: { extractedText, fileType },
        });
      }

      // 3. Plagiarism Check Slot (Future Integration Hook)
      // await this.plagiarismService.check(extractedText);

      // 4. Build isolated prompt
      const { systemPrompt, userPrompt } = this.promptBuilderService.buildEvaluationPrompt(
        {
          title: assignment.title,
          description: assignment.description || undefined,
          instructions: assignment.instructions || undefined,
          expectedOutcome: assignment.expectedOutcome || undefined,
          rubric: assignment.rubric,
          maxMarks,
        },
        {
          studentName: submission.studentName || undefined,
          fileName: submission.fileName,
          extractedText: extractedText || '',
        },
      );

      // 5. Call Ollama API (with 3x exponential backoff retries built into OllamaService)
      const rawAiResponse = await this.ollamaService.generateCompletion(
        systemPrompt,
        userPrompt,
        imageBase64List,
      );

      // 6. Parse and validate JSON result
      const parsedEval = this.resultParserService.parseAndValidate(rawAiResponse, maxMarks);

      // 7. Check confidence threshold (0.80 = 80%)
      const isHighConfidence = parsedEval.confidenceScore >= 0.80;
      const evaluationStatus = isHighConfidence ? 'COMPLETED' : 'REVIEW_REQUIRED';
      const submissionStatus = isHighConfidence ? 'COMPLETED' : 'REVIEW_REQUIRED';

      // 8. Count existing evaluations to increment version history (v1, v2, etc.)
      const existingCount = await this.prisma.assignmentAiEvaluation.count({
        where: { submissionId },
      });
      const newVersion = existingCount + 1;

      // 9. Store evaluation record in append-only evaluation history!
      const evalRecord = await this.prisma.assignmentAiEvaluation.create({
        data: {
          submissionId,
          version: newVersion,
          aiModel: this.ollamaService.model,
          promptVersion: this.promptBuilderService.PROMPT_VERSION,
          status: evaluationStatus,
          completionStatus: parsedEval.completionStatus,
          completionPercentage: parsedEval.completionPercentage,
          recommendedMarks: parsedEval.recommendedMarks,
          confidenceScore: parsedEval.confidenceScore,
          requirementsChecklist: parsedEval.requirementsChecklist as any,
          missingRequirements: parsedEval.missingRequirements as any,
          strengths: parsedEval.strengths as any,
          weaknesses: parsedEval.weaknesses as any,
          suggestions: parsedEval.suggestions as any,
          rawAiOutput: rawAiResponse,
        },
      });

      // Update submission status in DB
      await this.prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          currentStatus: submissionStatus,
        },
      });

      this.logger.log(
        `AI Evaluation Job completed for ${submissionId}: Version v${newVersion}, Status: ${submissionStatus}, Recommended Marks: ${parsedEval.recommendedMarks}/${maxMarks}, Confidence: ${(parsedEval.confidenceScore * 100).toFixed(0)}%`,
      );

      return evalRecord;
    } catch (err: any) {
      this.logger.error(`AI Evaluation Job failed for submission ${submissionId}: ${err.message}`, err.stack);

      // Record failed evaluation entry in history
      const existingCount = await this.prisma.assignmentAiEvaluation.count({
        where: { submissionId },
      });

      await this.prisma.assignmentAiEvaluation.create({
        data: {
          submissionId,
          version: existingCount + 1,
          aiModel: this.ollamaService.model,
          promptVersion: this.promptBuilderService.PROMPT_VERSION,
          status: 'FAILED',
          errorMessage: err.message,
        },
      });

      // Mark submission status as FAILED
      await this.prisma.assignmentSubmission.update({
        where: { id: submissionId },
        data: { currentStatus: 'FAILED' },
      });
    }
  }
}
