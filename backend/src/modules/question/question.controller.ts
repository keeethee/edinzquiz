import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importQuestions(
    @UploadedFile() file: Express.Multer.File,
    @Body('courseId') courseId: string,
  ) {
    return this.questionService.importQuestions(file, courseId);
  }

  @Post('bulk-save')
  bulkSaveQuestions(
    @Body('courseId') courseId: string,
    @Body('questions') questions: any[],
  ) {
    return this.questionService.bulkSave(courseId, questions);
  }

  @Get('template/download')
  async downloadTemplate(@Res() res: any) {
    const XLSX = await import('xlsx');
    const headers = [
      'Question', 'Question Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks', 'Difficulty', 'Explanation', 'Category', 'Tags'
    ];
    const data = [
      headers,
      [
        'What is Angular?', 'MCQ_SINGLE', 'Framework', 'Library', 'Database', 'Server', 'A', '2', 'Easy', 'Angular is a frontend framework', 'Technology', 'angular,frontend'
      ],
      [
        'What is NestJS?', 'MCQ_SINGLE', 'Framework', 'Library', 'CSS', 'DB', 'A', '2', 'Medium', 'NestJS is a backend framework', 'Technology', 'nestjs,backend'
      ]
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Template');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=question_import_template.xlsx');
    res.send(buffer);
  }
}
