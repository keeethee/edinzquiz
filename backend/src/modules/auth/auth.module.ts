import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminEntity } from '../../entities/admin.entity';
import { StudentEntity } from '../../entities/student.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity, StudentEntity]),
    JwtModule.register({
      global: true,
      secret: 'SECRET_JWT_KEY_EDINZ', // Simple key for quiz portal
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
