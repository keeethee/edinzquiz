import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AdminEntity, AdminSchema } from '../../entities/admin.entity';
import { StudentEntity, StudentSchema } from '../../entities/student.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminEntity.name, schema: AdminSchema },
      { name: StudentEntity.name, schema: StudentSchema },
    ]),
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
