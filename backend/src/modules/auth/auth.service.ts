import { Injectable, OnApplicationBootstrap, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Seed default admin on startup if not present
  async onApplicationBootstrap() {
    const adminCount = await this.prisma.admin.count();
    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await this.prisma.admin.create({
        data: {
          name: 'Default Admin',
          email: 'admin@edinz.com',
          passwordHash,
          role: 'admin',
        },
      });
      console.log('Seeded default admin user: admin@edinz.com / admin123');
    }
  }

  async login(email: string, pass: string): Promise<{ token: string; admin: { name: string; email: string } }> {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: admin.id, email: admin.email, role: admin.role };
    return {
      token: await this.jwtService.signAsync(payload),
      admin: {
        name: admin.name,
        email: admin.email,
      },
    };
  }

  // Student Auth methods
  async registerStudent(email: string, pass: string, name: string, collegeName: string): Promise<any> {
    const existing = await this.prisma.student.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(`Student with email "${email}" already registered.`);
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    return this.prisma.student.create({
      data: {
        email,
        passwordHash,
        name,
        collegeName,
      },
    });
  }

  async loginStudent(email: string, pass: string): Promise<{ token: string; student: { id: string; name: string; email: string; collegeName: string } }> {
    const student = await this.prisma.student.findUnique({ where: { email } });
    if (!student) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, student.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: student.id, email: student.email, role: 'student' };
    return {
      token: await this.jwtService.signAsync(payload),
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        collegeName: student.collegeName,
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
