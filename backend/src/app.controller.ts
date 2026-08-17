import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { StudentActivityService } from './modules/student-activity/student-activity.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly studentActivityService: StudentActivityService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('student-activity/summary')
  async getActivitySummary() {
    return this.studentActivityService.getActivitySummary();
  }

  @Get('student-activity/logs')
  async getActivityLogs(
    @Query('filterType') filterType?: string,
    @Query('filterValue') filterValue?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.studentActivityService.getActivityLogs(filterType, filterValue, courseId);
  }

  @Post('student-activity/course-access')
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
