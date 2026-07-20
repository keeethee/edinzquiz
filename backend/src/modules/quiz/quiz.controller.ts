import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // Category endpoints
  @Get('categories')
  getCategories() {
    return this.quizService.getCategories();
  }

  @UseGuards(AuthGuard)
  @Post('categories')
  createCategory(
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.quizService.createCategory(name, description);
  }

  // Quiz CRUD
  @UseGuards(AuthGuard)
  @Post()
  createQuiz(@Body() body: any) {
    return this.quizService.createQuiz(body);
  }

  @Get()
  getQuizzes(@Query('courseId') courseId?: string) {
    return this.quizService.findAll(courseId);
  }

  @Get('course/:courseId')
  getQuizzesByCourse(@Param('courseId') courseId: string) {
    return this.quizService.getQuizzesByCourse(courseId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  getQuiz(@Param('id') id: string) {
    return this.quizService.getQuiz(id);
  }

  @Get('student/:id')
  getQuizForStudent(@Param('id') id: string) {
    return this.quizService.getQuizForStudent(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  updateQuiz(@Param('id') id: string, @Body() body: any) {
    return this.quizService.updateQuiz(id, body);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteQuiz(@Param('id') id: string) {
    return this.quizService.deleteQuiz(id);
  }

  // Timing & Publish endpoints
  @UseGuards(AuthGuard)
  @Patch(':id/publish')
  publishQuiz(@Param('id') id: string) {
    return this.quizService.publishQuiz(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/unpublish')
  unpublishQuiz(@Param('id') id: string) {
    return this.quizService.unpublishQuiz(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/duplicate')
  duplicateQuiz(@Param('id') id: string) {
    return this.quizService.duplicateQuiz(id);
  }

  // Question attachments
  @UseGuards(AuthGuard)
  @Post(':id/questions')
  addQuestionsToQuiz(
    @Param('id') id: string,
    @Body('questionIds') questionIds: string[],
    @Body('marks') marks?: number,
  ) {
    return this.quizService.addQuestionsToQuiz(id, questionIds, marks);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/questions/:questionId')
  removeQuestionFromQuiz(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
  ) {
    return this.quizService.removeQuestionFromQuiz(id, questionId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/questions/:questionId/marks')
  updateQuizQuestionMarks(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body('marks') marks: number,
  ) {
    return this.quizService.updateQuizQuestionMarks(id, questionId, marks);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/questions/reorder')
  reorderQuestions(
    @Param('id') id: string,
    @Body('questionIds') questionIds: string[],
  ) {
    return this.quizService.reorderQuestions(id, questionIds);
  }

  // Student attempts and Submissions
  @Post(':id/start')
  startQuizAttempt(
    @Param('id') id: string,
    @Body('studentId') studentId: string,
  ) {
    return this.quizService.startQuizAttempt(id, studentId);
  }

  @Post('submit')
  submitQuiz(@Body() body: any) {
    return this.quizService.submitQuiz(body);
  }

  @Get('submissions/student-result/:id')
  getStudentResult(@Param('id') id: string) {
    return this.quizService.getStudentResult(id);
  }

  @UseGuards(AuthGuard)
  @Get('submissions/list')
  getSubmissionsList() {
    return this.quizService.getSubmissionsList();
  }

  @UseGuards(AuthGuard)
  @Get('submissions/:id')
  getSubmission(@Param('id') id: string) {
    return this.quizService.getSubmission(id);
  }

  @UseGuards(AuthGuard)
  @Patch('submissions/:id/evaluate')
  evaluateEssayAnswers(
    @Param('id') id: string,
    @Body('evaluations') evaluations: any[],
  ) {
    return this.quizService.evaluateEssayAnswers(id, evaluations);
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.quizService.getLeaderboard(id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/analytics')
  getAnalytics(@Param('id') id: string) {
    return this.quizService.getAnalytics(id);
  }
}
