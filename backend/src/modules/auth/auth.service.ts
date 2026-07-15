import { Injectable, OnApplicationBootstrap, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminEntity, AdminDocument } from '../../entities/admin.entity';
import { StudentEntity, StudentDocument } from '../../entities/student.entity';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(AdminEntity.name)
    private adminModel: Model<AdminDocument>,
    @InjectModel(StudentEntity.name)
    private studentModel: Model<StudentDocument>,
    private jwtService: JwtService,
  ) {}

  // Seed default admin on startup
  async onApplicationBootstrap() {
    const adminCount = await this.adminModel.countDocuments();
    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const defaultAdmin = new this.adminModel({
        name: 'Default Admin',
        email: 'admin@edinz.com',
        passwordHash,
        role: 'admin',
      });
      await defaultAdmin.save();
      console.log('Seeded default admin user: admin@edinz.com / admin123');
    }
  }

  async login(email: string, pass: string): Promise<{ token: string; admin: { name: string; email: string } }> {
    const admin = await this.adminModel.findOne({ email }).exec();
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: admin._id, email: admin.email, role: admin.role };
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
    const existing = await this.studentModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException(`Student with email "${email}" already registered.`);
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    const student = new this.studentModel({
      email,
      passwordHash,
      name,
      collegeName,
    });
    return student.save();
  }

  async loginStudent(email: string, pass: string): Promise<{ token: string; student: { id: string; name: string; email: string; collegeName: string } }> {
    const student = await this.studentModel.findOne({ email }).exec();
    if (!student) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, student.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: student._id, email: student.email, role: 'student' };
    return {
      token: await this.jwtService.signAsync(payload),
      student: {
        id: student._id,
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
