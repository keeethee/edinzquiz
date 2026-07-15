import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseEntity, CourseSchema } from '../../entities/course.entity';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CourseEntity.name, schema: CourseSchema }]),
    AuthModule,
  ],
  providers: [CourseService],
  controllers: [CourseController],
  exports: [CourseService, MongooseModule],
})
export class CourseModule {}
