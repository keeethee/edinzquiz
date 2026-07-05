import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AdminEntity } from '../../entities/admin.entity';
import { StudentEntity } from '../../entities/student.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockAdminRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockStudentRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('MOCK_JWT_TOKEN'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 1, email: 'admin@edinz.com' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(AdminEntity), useValue: mockAdminRepository },
        { provide: getRepositoryToken(StudentEntity), useValue: mockStudentRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if admin not found', async () => {
      mockAdminRepository.findOneBy.mockResolvedValue(null);
      await expect(service.login('wrong@email.com', 'pwd')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const admin = new AdminEntity();
      admin.email = 'admin@edinz.com';
      admin.passwordHash = await bcrypt.hash('correct_password', 10);
      
      mockAdminRepository.findOneBy.mockResolvedValue(admin);
      await expect(service.login('admin@edinz.com', 'wrong_password')).rejects.toThrow(UnauthorizedException);
    });

    it('should return a token and admin details on successful login', async () => {
      const password = 'correct_password';
      const admin = new AdminEntity();
      admin.name = 'Admin User';
      admin.email = 'admin@edinz.com';
      admin.passwordHash = await bcrypt.hash(password, 10);

      mockAdminRepository.findOneBy.mockResolvedValue(admin);
      const result = await service.login('admin@edinz.com', password);
      
      expect(result).toHaveProperty('token');
      expect(result.admin.name).toBe('Admin User');
    });
  });
});
