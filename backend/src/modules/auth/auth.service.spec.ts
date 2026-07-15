import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AdminEntity } from '../../entities/admin.entity';
import { StudentEntity } from '../../entities/student.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockAdminModel = {
    countDocuments: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockStudentModel = {
    findOne: jest.fn().mockReturnThis(),
    exec: jest.fn(),
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
        { provide: getModelToken(AdminEntity.name), useValue: mockAdminModel },
        { provide: getModelToken(StudentEntity.name), useValue: mockStudentModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
