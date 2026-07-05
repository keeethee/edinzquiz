import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentService } from './assignment.service';
import { AssignmentEntity } from '../../entities/assignment.entity';
import { AssignmentSubmissionEntity } from '../../entities/assignment-submission.entity';
import { CourseEntity } from '../../entities/course.entity';
import { NotFoundException } from '@nestjs/common';

describe('AssignmentService', () => {
  let service: AssignmentService;

  const mockAssignmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockSubmissionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockCourseRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        { provide: getRepositoryToken(AssignmentEntity), useValue: mockAssignmentRepository },
        { provide: getRepositoryToken(AssignmentSubmissionEntity), useValue: mockSubmissionRepository },
        { provide: getRepositoryToken(CourseEntity), useValue: mockCourseRepository },
      ],
    }).compile();

    service = module.get<AssignmentService>(AssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitAssignment', () => {
    it('should throw NotFoundException if course is not found', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.submitAssignment(999, 'Student', 'College', { originalname: 'test.pdf', path: 'path' } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('should save submission and match columns successfully', async () => {
      const course = new CourseEntity();
      course.id = 1;
      course.courseName = 'Java Coding';
      
      const file = { originalname: 'my_lab.zip', path: 'uploads/file.zip' } as any;
      const sub = new AssignmentSubmissionEntity();
      sub.studentName = 'Alice';
      sub.collegeName = 'MIT';
      sub.fileName = file.originalname;
      sub.filePath = file.path;

      mockCourseRepository.findOneBy.mockResolvedValue(course);
      mockSubmissionRepository.create.mockReturnValue(sub);
      mockSubmissionRepository.save.mockResolvedValue(sub);

      const result = await service.submitAssignment(1, 'Alice', 'MIT', file);
      expect(result.studentName).toBe('Alice');
      expect(result.fileName).toBe('my_lab.zip');
    });
  });

  describe('gradeSubmission', () => {
    it('should update marks and feedback on a submission', async () => {
      const sub = new AssignmentSubmissionEntity();
      sub.id = 1;
      sub.studentName = 'Bob';
      sub.marks = null;
      sub.feedback = null;

      mockSubmissionRepository.findOne.mockResolvedValue(sub);
      mockSubmissionRepository.save.mockImplementation(arg => Promise.resolve(arg));

      const graded = await service.gradeSubmission(1, 95, 'Great submission!');
      expect(graded.marks).toBe(95);
      expect(graded.feedback).toBe('Great submission!');
    });
  });
});
