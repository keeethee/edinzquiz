import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('question-bank')
@UseGuards(AuthGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  getQuestions(
    @Query('courseId') courseId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('questionType') questionType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.questionService.findFiltered({
      courseId,
      difficulty,
      questionType,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  getQuestion(@Param('id') id: string) {
    return this.questionService.findOne(id);
  }

  @Post()
  createQuestion(@Body() body: any) {
    return this.questionService.create(body);
  }

  @Patch(':id')
  updateQuestion(@Param('id') id: string, @Body() body: any) {
    return this.questionService.update(id, body);
  }

  @Delete(':id')
  deleteQuestion(@Param('id') id: string) {
    return this.questionService.delete(id);
  }
}
