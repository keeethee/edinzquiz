import { Injectable, OnApplicationBootstrap, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminEntity } from '../../entities/admin.entity';
import { StudentEntity } from '../../entities/student.entity';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(AdminEntity)
    private adminRepository: Repository<AdminEntity>,
    @InjectRepository(StudentEntity)
    private studentRepository: Repository<StudentEntity>,
    private jwtService: JwtService,
  ) {}

  // Seed default admin on startup
  async onApplicationBootstrap() {
    const adminCount = await this.adminRepository.count();
    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const defaultAdmin = this.adminRepository.create({
        name: 'Default Admin',
        email: 'admin@edinz.com',
        passwordHash,
        role: 'admin',
      });
      await this.adminRepository.save(defaultAdmin);
      console.log('Seeded default admin user: admin@edinz.com / admin123');
    }
  }

  async login(email: string, pass: string): Promise<{ token: string; admin: { name: string; email: string } }> {
    const admin = await this.adminRepository.findOneBy({ email });
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
  async registerStudent(email: string, pass: string, name: string, collegeName: string): Promise<StudentEntity> {
    const existing = await this.studentRepository.findOneBy({ email });
    if (existing) {
      throw new ConflictException(`Student with email "${email}" already registered.`);
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    const student = this.studentRepository.create({
      email,
      passwordHash,
      name,
      collegeName,
    });
    return this.studentRepository.save(student);
  }

  async loginStudent(email: string, pass: string): Promise<{ token: string; student: { id: number; name: string; email: string; collegeName: string } }> {
    const student = await this.studentRepository.findOneBy({ email });
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
