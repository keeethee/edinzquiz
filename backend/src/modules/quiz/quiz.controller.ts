import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as express from 'express';
import * as fs from 'fs';
import { QuizService } from './quiz.service';
import { QuizEntity } from '../../entities/quiz.entity';
import { QuestionEntity } from '../../entities/question.entity';
import { QuizSubmissionEntity } from '../../entities/quiz-submission.entity';
import { AuthGuard } from '../auth/auth.guard';
import { CategoryEntity } from '../../entities/category.entity';

// Multer Disk Storage config for images and attachments
const storageConfig = diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // Category endpoints
  @Get('categories')
  getCategories(): Promise<CategoryEntity[]> {
    return this.quizService.getCategories();
  }

  @UseGuards(AuthGuard)
  @Post('categories')
  createCategory(
    @Body('name') name: string,
    @Body('description') description?: string
  ): Promise<CategoryEntity> {
    return this.quizService.createCategory(name, description);
  }

  @UseGuards(AuthGuard)
  @Post()
  createQuiz(
    @Body('courseId') courseId: string,
    @Body('quizTitle') quizTitle: string,
    @Body('startTime') startTime: string,
    @Body('endTime') endTime: string,
    @Body('totalMarks') totalMarks: number,
    @Body('duration') duration?: number,
    @Body('passingMarks') passingMarks?: number,
    @Body('negativeMarkingEnabled') negativeMarkingEnabled?: boolean,
    @Body('negativeMarkingValue') negativeMarkingValue?: number,
    @Body('shuffleQuestions') shuffleQuestions?: boolean,
    @Body('shuffleOptions') shuffleOptions?: boolean,
    @Body('description') description?: string,
    @Body('difficulty') difficulty?: string,
    @Body('categoryId') categoryId?: string,
    @Body('settings') settings?: { maxAttempts?: number; passingPercentage?: number; showResultsImmediately?: boolean }
  ): Promise<QuizEntity> {
    return this.quizService.createQuiz(
      courseId,
      quizTitle,
      new Date(startTime),
      new Date(endTime),
      totalMarks,
      duration,
      passingMarks,
      negativeMarkingEnabled,
      negativeMarkingValue,
      shuffleQuestions,
      shuffleOptions,
      description,
      difficulty,
      categoryId,
      settings
    );
  }

  // Get quizzes for a course (Student and Admin list)
  @Get('course/:courseId')
  getQuizzesByCourse(@Param('courseId') courseId: string): Promise<QuizEntity[]> {
    return this.quizService.getQuizzesByCourse(courseId);
  }

  // Get a specific quiz with answers (Admin only)
  @UseGuards(AuthGuard)
  @Get(':id')
  getQuiz(@Param('id') id: string): Promise<QuizEntity> {
    return this.quizService.getQuiz(id);
  }

  // Get a quiz dynamically for student (Verifies timing, hides answer key)
  @Get('student/:id')
  getQuizForStudent(@Param('id') id: string): Promise<any> {
    return this.quizService.getQuizForStudent(id);
  }

  // Unified quiz updates
  @UseGuards(AuthGuard)
  @Patch(':id')
  updateQuiz(
    @Param('id') id: string,
    @Body() body: any
  ): Promise<QuizEntity> {
    return this.quizService.updateQuiz(id, body);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/timing')
  updateTiming(
    @Param('id') id: string,
    @Body('startTime') startTime?: string,
    @Body('endTime') endTime?: string,
    @Body('status') status?: string,
    @Body('resultsPublished') resultsPublished?: boolean,
  ): Promise<QuizEntity> {
    return this.quizService.updateTiming(
      id,
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
      status,
      resultsPublished,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteQuiz(@Param('id') id: string): Promise<void> {
    return this.quizService.deleteQuiz(id);
  }

  // Duplicate an existing quiz
  @UseGuards(AuthGuard)
  @Post(':id/duplicate')
  duplicateQuiz(@Param('id') id: string): Promise<QuizEntity> {
    return this.quizService.duplicateQuiz(id);
  }

  // Drag and drop question reordering
  @UseGuards(AuthGuard)
  @Patch(':id/questions/reorder')
  async reorderQuestions(
    @Param('id') id: string,
    @Body('questionIds') questionIds: string[]
  ): Promise<{ success: boolean }> {
    await this.quizService.reorderQuestions(id, questionIds);
    return { success: true };
  }

  // Question endpoints
  @UseGuards(AuthGuard)
  @Post('questions')
  addQuestion(
    @Body('quizId') quizId: string,
    @Body('questionText') questionText: string,
    @Body('questionType') questionType: string,
    @Body('mark') mark: number,
    @Body('correctAnswerText') correctAnswerText?: string,
    @Body('options') options?: { optionText: string; isCorrect: boolean }[],
  ): Promise<QuestionEntity> {
    return this.quizService.addQuestion(quizId, questionText, questionType, mark, correctAnswerText, options);
  }

  @UseGuards(AuthGuard)
  @Patch('questions/:id')
  updateQuestion(
    @Param('id') id: string,
    @Body() body: any
  ): Promise<QuestionEntity> {
    return this.quizService.updateQuestion(id, body);
  }

  @UseGuards(AuthGuard)
  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string): Promise<void> {
    return this.quizService.deleteQuestion(id);
  }

  @UseGuards(AuthGuard)
  @Patch('questions/:id/answer-key')
  async updateAnswerKey(
    @Param('id') id: string,
    @Body('correctOptionId') correctOptionId: string,
  ): Promise<{ success: boolean }> {
    await this.quizService.updateAnswerKey(id, correctOptionId);
    return { success: true };
  }

  // Media uploading
  @UseGuards(AuthGuard)
  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file', { storage: storageConfig }))
  async uploadMedia(@UploadedFile() file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const attachment = await this.quizService.logMediaAttachment(file.originalname, file.path, file.mimetype);
    return {
      id: attachment._id,
      fileName: attachment.fileName,
      url: `/uploads/${file.filename}`,
    };
  }

  // Submission endpoints
  @Post('submit')
  async submitQuiz(
    @Body('quizId') quizId: string,
    @Body('studentId') studentId: string,
    @Body('answers') answers: { questionId: string; selectedOptionId?: string; selectedOptionIds?: string[]; typedAnswerText?: string }[],
    @Body('timeTakenSeconds') timeTakenSeconds?: number,
  ): Promise<QuizSubmissionEntity> {
    return this.quizService.submitQuiz(quizId, studentId, answers, timeTakenSeconds || 0);
  }

  @Get('submissions/student-result/:id')
  getStudentSubmissionResult(
    @Param('id') id: string,
    @Body('studentId') studentId: string,
  ): Promise<any> {
    return this.quizService.getStudentSubmissionResult(id, studentId);
  }

  @Get(':id/attempt-stats')
  getAttemptStats(
    @Param('id') id: string,
    @Body('studentId') studentId: string,
  ): Promise<any> {
    return this.quizService.getAttemptStats(id, studentId);
  }

  @UseGuards(AuthGuard)
  @Get('submissions/list')
  getSubmissions(): Promise<QuizSubmissionEntity[]> {
    return this.quizService.getSubmissions();
  }

  @UseGuards(AuthGuard)
  @Get('submissions/export')
  async exportSubmissions(@Res() res: express.Response) {
    const csv = await this.quizService.generateCSVReport();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=quiz_submissions.csv');
    return res.status(200).send(csv);
  }

  @UseGuards(AuthGuard)
  @Get('submissions/:id')
  getSubmissionDetail(@Param('id') id: string): Promise<any> {
    return this.quizService.getSubmissionDetail(id);
  }

  // Evaluation subjective grading
  @UseGuards(AuthGuard)
  @Patch('submissions/:id/evaluate')
  evaluateSubmission(
    @Param('id') id: string,
    @Body('evaluations') evaluations: { questionId: string; marks: number }[],
  ): Promise<QuizSubmissionEntity> {
    return this.quizService.evaluateSubmission(id, evaluations);
  }

  // Analytics & Leaderboards
  @UseGuards(AuthGuard)
  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string): Promise<QuizSubmissionEntity[]> {
    return this.quizService.getLeaderboard(id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/analytics')
  getAnalytics(@Param('id') id: string): Promise<any> {
    return this.quizService.getAnalytics(id);
  }
}
