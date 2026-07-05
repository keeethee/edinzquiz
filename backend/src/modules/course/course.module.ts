import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../../entities/course.entity';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity]), AuthModule],
  providers: [CourseService],
  controllers: [CourseController],
  exports: [CourseService, TypeOrmModule],
})
export class CourseModule {}
