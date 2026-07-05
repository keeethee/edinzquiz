import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuizService } from './quiz.service';
import { QuizEntity } from '../../entities/quiz.entity';
import { QuestionEntity } from '../../entities/question.entity';
import { OptionEntity } from '../../entities/option.entity';
import { QuizSubmissionEntity } from '../../entities/quiz-submission.entity';
import { StudentAnswerEntity } from '../../entities/student-answer.entity';
import { CourseEntity } from '../../entities/course.entity';
import { StudentEntity } from '../../entities/student.entity';

describe('QuizService', () => {
  let service: QuizService;

  const mockQuizRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockQuestionRepository = {};
  const mockOptionRepository = {};
  const mockSubmissionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockStudentAnswerRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockCourseRepository = {};
  const mockStudentRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: getRepositoryToken(QuizEntity), useValue: mockQuizRepository },
        { provide: getRepositoryToken(QuestionEntity), useValue: mockQuestionRepository },
        { provide: getRepositoryToken(OptionEntity), useValue: mockOptionRepository },
        { provide: getRepositoryToken(QuizSubmissionEntity), useValue: mockSubmissionRepository },
        { provide: getRepositoryToken(StudentAnswerEntity), useValue: mockStudentAnswerRepository },
        { provide: getRepositoryToken(CourseEntity), useValue: mockCourseRepository },
        { provide: getRepositoryToken(StudentEntity), useValue: mockStudentRepository },
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
