import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AssignmentService } from './assignment.service';
import { AssignmentEntity } from '../../entities/assignment.entity';
import { AssignmentSubmissionEntity } from '../../entities/assignment-submission.entity';
import { CourseEntity } from '../../entities/course.entity';

describe('AssignmentService', () => {
  let service: AssignmentService;

  const mockAssignmentModel = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    findById: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockReturnThis(),
  };

  const mockSubmissionModel = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    findById: jest.fn().mockReturnThis(),
  };

  const mockCourseModel = {
    findById: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        { provide: getModelToken(AssignmentEntity.name), useValue: mockAssignmentModel },
        { provide: getModelToken(AssignmentSubmissionEntity.name), useValue: mockSubmissionModel },
        { provide: getModelToken(CourseEntity.name), useValue: mockCourseModel },
      ],
    }).compile();

    service = module.get<AssignmentService>(AssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
