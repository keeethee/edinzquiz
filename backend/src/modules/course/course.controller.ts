import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseEntity } from '../../entities/course.entity';
import { AuthGuard } from '../auth/auth.guard';
import { StudentActivityService } from '../student-activity/student-activity.service';

@Controller('courses')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly studentActivityService: StudentActivityService,
  ) {}

  @Get('activity/summary')
  getActivitySummary() {
    return this.studentActivityService.getActivitySummary();
  }

  @Get('activity/logs')
  getActivityLogs(
    @Query('filterType') filterType?: string,
    @Query('filterValue') filterValue?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.studentActivityService.getActivityLogs(filterType, filterValue, courseId);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body('courseId') courseId: string,
    @Body('courseName') courseName: string,
    @Body('duration') duration?: string,
    @Body('status') status?: string,
  ): Promise<CourseEntity> {
    return this.courseService.create(courseId, courseName, duration, status);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('courseId') courseId: string,
    @Body('courseName') courseName: string,
    @Body('duration') duration?: string,
    @Body('status') status?: string,
  ): Promise<CourseEntity> {
    return this.courseService.update(id, courseId, courseName, duration, status);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<CourseEntity[]> {
    return this.courseService.findAll();
  }

  // Student public course lookup by display ID code (e.g. 'CS-101' or '412')
  @Get('lookup/:courseId')
  findByCourseId(@Param('courseId') courseId: string): Promise<CourseEntity> {
    return this.courseService.findByCourseId(courseId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<CourseEntity> {
    return this.courseService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.courseService.delete(id);
  }
}
