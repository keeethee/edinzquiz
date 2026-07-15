import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { QuizService } from './quiz.service';
import { QuizEntity } from '../../entities/quiz.entity';
import { QuizSubmissionEntity } from '../../entities/quiz-submission.entity';
import { CourseEntity } from '../../entities/course.entity';
import { StudentEntity } from '../../entities/student.entity';
import { CategoryEntity } from '../../entities/category.entity';
import { MediaAttachmentEntity } from '../../entities/media-attachment.entity';

describe('QuizService', () => {
  let service: QuizService;

  const mockQuizModel = {
    findOne: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    countDocuments: jest.fn(),
  };
  const mockSubmissionModel = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockCourseModel = {};
  const mockStudentModel = {};
  const mockCategoryModel = {
    countDocuments: jest.fn(),
  };
  const mockMediaModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: getModelToken(QuizEntity.name), useValue: mockQuizModel },
        { provide: getModelToken(QuizSubmissionEntity.name), useValue: mockSubmissionModel },
        { provide: getModelToken(CourseEntity.name), useValue: mockCourseModel },
        { provide: getModelToken(StudentEntity.name), useValue: mockStudentModel },
        { provide: getModelToken(CategoryEntity.name), useValue: mockCategoryModel },
        { provide: getModelToken(MediaAttachmentEntity.name), useValue: mockMediaModel },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuizAccessStatus', () => {
    it('should return "stopped" if status is "Force stopped"', () => {
      const quiz = new QuizEntity();
      quiz.status = 'Force stopped';
      expect(service.getQuizAccessStatus(quiz)).toBe('stopped');
    });

    it('should return "closed" if status is "Closed"', () => {
      const quiz = new QuizEntity();
      quiz.status = 'Closed';
      expect(service.getQuizAccessStatus(quiz)).toBe('closed');
    });

    it('should return "not-started" if current time is before startTime', () => {
      const quiz = new QuizEntity();
      quiz.status = 'Published';
      quiz.startTime = new Date(Date.now() + 100000); // 100s in the future
      quiz.endTime = new Date(Date.now() + 200000);
      expect(service.getQuizAccessStatus(quiz)).toBe('not-started');
    });

    it('should return "closed" if current time is after endTime', () => {
      const quiz = new QuizEntity();
      quiz.status = 'Published';
      quiz.startTime = new Date(Date.now() - 200000);
      quiz.endTime = new Date(Date.now() - 100000); // in the past
      expect(service.getQuizAccessStatus(quiz)).toBe('closed');
    });

    it('should return "active" if current time is within start and end time', () => {
      const quiz = new QuizEntity();
      quiz.status = 'Published';
      quiz.startTime = new Date(Date.now() - 100000);
      quiz.endTime = new Date(Date.now() + 100000);
      expect(service.getQuizAccessStatus(quiz)).toBe('active');
    });
  });
});
