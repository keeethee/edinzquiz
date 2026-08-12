import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { StudentActivityModule } from '../student-activity/student-activity.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'SECRET_JWT_KEY_EDINZ', // Simple key for quiz portal
      signOptions: { expiresIn: '1d' },
    }),
    StudentActivityModule,
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
