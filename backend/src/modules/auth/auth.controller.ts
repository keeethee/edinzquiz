import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.login(email, password);
  }

  // Student auth endpoints
  @Post('student/register')
  async registerStudent(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('name') name: string,
    @Body('collegeName') collegeName: string,
  ) {
    return this.authService.registerStudent(email, password, name, collegeName);
  }

  @Post('student/login')
  async loginStudent(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.loginStudent(email, password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
