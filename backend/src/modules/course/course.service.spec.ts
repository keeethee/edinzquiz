import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CourseService } from './course.service';
import { CourseEntity } from '../../entities/course.entity';

describe('CourseService', () => {
  let service: CourseService;

  const mockCourseModel = {
    findOne: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        { provide: getModelToken(CourseEntity.name), useValue: mockCourseModel },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
