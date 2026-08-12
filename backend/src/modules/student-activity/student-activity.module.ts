import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudentActivityService } from './student-activity.service';
import { StudentActivityController } from './student-activity.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [StudentActivityController],
  providers: [StudentActivityService],
  exports: [StudentActivityService],
})
export class StudentActivityModule {}
