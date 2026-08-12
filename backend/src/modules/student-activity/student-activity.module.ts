import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StudentActivityService } from './student-activity.service';
import { StudentActivityController } from './student-activity.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StudentActivityController],
  providers: [StudentActivityService],
  exports: [StudentActivityService],
})
export class StudentActivityModule {}
