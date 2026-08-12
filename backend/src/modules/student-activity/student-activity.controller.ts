import { Controller, Get, Post, Query, Body, UseGuards, Req } from '@nestjs/common';
import { StudentActivityService } from './student-activity.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('student-activity')
export class StudentActivityController {
  constructor(private readonly studentActivityService: StudentActivityService) {}

  /**
   * Admin-only: Get filtered activity logs
   * Query params: filterType (day|month|year), filterValue (date string), courseId
   */
  @UseGuards(AuthGuard)
  @Get('logs')
  async getActivityLogs(
    @Query('filterType') filterType?: string,
    @Query('filterValue') filterValue?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.studentActivityService.getActivityLogs(filterType, filterValue, courseId);
  }

  /**
   * Admin-only: Get summary statistics
   */
  @UseGuards(AuthGuard)
  @Get('summary')
  async getActivitySummary() {
    return this.studentActivityService.getActivitySummary();
  }

  /**
   * Student-facing: Record course access event
   * Called when a student selects/switches a course
   */
  @UseGuards(AuthGuard)
  @Post('course-access')
  async recordCourseAccess(
    @Body('courseId') courseId: string,
    @Req() req: any,
  ) {
    const studentId = req.user?.sub;
    if (!studentId || !courseId) {
      return { message: 'Missing studentId or courseId' };
    }

    const ip = req.headers?.['x-forwarded-for'] || req.ip || null;
    const ua = req.headers?.['user-agent'] || null;

    await this.studentActivityService.recordCourseAccess(studentId, courseId, ip, ua);
    return { message: 'Course access recorded' };
  }
}
