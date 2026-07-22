import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Res, NotFoundException, BadRequestException, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path';
import * as express from 'express';
import * as fs from 'fs';
import { AssignmentService } from './assignment.service';
import { AssignmentEntity } from '../../entities/assignment.entity';
import { AssignmentSubmissionEntity } from '../../entities/assignment-submission.entity';
import { AuthGuard } from '../auth/auth.guard';

// Custom Storage Config for Multer
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

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body('courseId') courseId: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('deadline') deadline: string,
  ): Promise<AssignmentEntity> {
    return this.assignmentService.create(courseId, title, description, new Date(deadline));
  }

  // Public endpoint for students to view pending assignments
  @Get('course/:courseId')
  getAssignmentsByCourse(@Param('courseId') courseId: string): Promise<AssignmentEntity[]> {
    return this.assignmentService.getAssignmentsByCourse(courseId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.assignmentService.delete(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('title') title?: string,
    @Body('description') description?: string,
    @Body('deadline') deadline?: string,
  ): Promise<AssignmentEntity> {
    return this.assignmentService.updateAssignment(id, {
      title,
      description,
      deadline: deadline ? new Date(deadline) : undefined,
    } as any);
  }

  // Public upload endpoint for students
  @Post('submit')
  @UseInterceptors(FileInterceptor('file', { storage: storageConfig }))
  submitAssignment(
    @Body('courseId') courseId: string,
    @Body('assignmentId') assignmentId: string,
    @Body('studentName') studentName: string,
    @Body('collegeName') collegeName: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AssignmentSubmissionEntity> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.assignmentService.submitAssignment(courseId, studentName, collegeName, assignmentId, file);
  }

  @UseGuards(AuthGuard)
  @Get('student/submissions')
  getStudentSubmissions(
    @Query('studentName') studentName: string,
    @Query('collegeName') collegeName: string,
  ): Promise<AssignmentSubmissionEntity[]> {
    return this.assignmentService.getStudentSubmissions(studentName, collegeName);
  }

  @UseGuards(AuthGuard)
  @Get('submissions')
  getSubmissions(@Query('courseId') courseId?: string): Promise<AssignmentSubmissionEntity[]> {
    return this.assignmentService.getSubmissions(courseId);
  }

  @UseGuards(AuthGuard)
  @Get('submissions/:id/download')
  async downloadFile(
    @Param('id') id: string,
    @Res() res: express.Response,
  ): Promise<void> {
    const submission = await this.assignmentService.getSubmission(id);
    const filePath = submission.fileUrl || (submission as any).filePath;
    if (!filePath) {
      throw new NotFoundException('File path missing in submission metadata');
    }
    
    let absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      absolutePath = path.resolve(process.cwd(), 'backend', filePath);
    }

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('File not found on server');
    }

    res.sendFile(absolutePath);
  }

  @UseGuards(AuthGuard)
  @Patch('submissions/:id/grade')
  gradeSubmission(
    @Param('id') id: string,
    @Body('marks') marks: number,
    @Body('feedback') feedback: string,
  ): Promise<AssignmentSubmissionEntity> {
    return this.assignmentService.gradeSubmission(id, marks, feedback);
  }
}
