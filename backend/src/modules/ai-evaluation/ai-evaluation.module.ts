import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { FileProcessingService } from './services/file-processing.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { OllamaService } from './services/ollama.service';
import { ResultParserService } from './services/result-parser.service';
import { EvaluationQueueService } from './services/evaluation-queue.service';
import { AiEvaluationService } from './services/ai-evaluation.service';
import { AiEvaluationController } from './ai-evaluation.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    FileProcessingService,
    PromptBuilderService,
    OllamaService,
    ResultParserService,
    EvaluationQueueService,
    AiEvaluationService,
  ],
  controllers: [AiEvaluationController],
  exports: [AiEvaluationService, FileProcessingService],
})
export class AiEvaluationModule {}
