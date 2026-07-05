import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseService } from './course.service';
import { CourseEntity } from '../../entities/course.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CourseService', () => {
  let service: CourseService;

  const mockCourseRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        { provide: getRepositoryToken(CourseEntity), useValue: mockCourseRepository },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if courseId code already exists', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue(new CourseEntity());
      await expect(service.create('412', 'Python')).rejects.toThrow(ConflictException);
    });

    it('should create and return a course on success', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue(null);
      const course = { id: 1, courseId: '412', courseName: 'Python' };
      mockCourseRepository.create.mockReturnValue(course);
      mockCourseRepository.save.mockResolvedValue(course);

      const result = await service.create('412', 'Python');
      expect(result.courseName).toBe('Python');
    });
  });

  describe('findByCourseId', () => {
    it('should throw NotFoundException if course not found or is inactive', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);
      await expect(service.findByCourseId('CS-999')).rejects.toThrow(NotFoundException);
    });

    it('should return course details on active lookup match', async () => {
      const course = new CourseEntity();
      course.courseId = 'CS-101';
      course.courseName = 'Introduction';
      course.status = 'Active';
      
      mockCourseRepository.findOne.mockResolvedValue(course);
      const result = await service.findByCourseId('CS-101');
      expect(result.courseName).toBe('Introduction');
    });
  });
});
