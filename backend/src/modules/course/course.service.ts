import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from '../../entities/course.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepository: Repository<CourseEntity>,
  ) {}

  async create(courseId: string, courseName: string, duration?: string, status: string = 'Active'): Promise<CourseEntity> {
    const existing = await this.courseRepository.findOneBy({ courseId });
    if (existing) {
      throw new ConflictException(`Course with display ID "${courseId}" already exists.`);
    }

    const course = this.courseRepository.create({
      courseId,
      courseName,
      duration,
      status,
    });
    return this.courseRepository.save(course);
  }

  async update(id: number, courseId: string, courseName: string, duration?: string, status?: string): Promise<CourseEntity> {
    const course = await this.findOne(id);
    
    if (course.courseId !== courseId) {
      const existing = await this.courseRepository.findOneBy({ courseId });
      if (existing) {
        throw new ConflictException(`Course with display ID "${courseId}" already exists.`);
      }
    }

    course.courseId = courseId;
    course.courseName = courseName;
    if (duration !== undefined) course.duration = duration;
    if (status !== undefined) course.status = status;

    return this.courseRepository.save(course);
  }

  async findAll(): Promise<CourseEntity[]> {
    return this.courseRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<CourseEntity> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: { quizzes: true, submissions: true },
    });
    if (!course) {
      throw new NotFoundException(`Course with DB ID ${id} not found`);
    }
    return course;
  }

  async findByCourseId(courseId: string): Promise<CourseEntity> {
    const course = await this.courseRepository.findOne({
      where: { courseId, status: 'Active' },
      relations: { quizzes: true },
    });
    if (!course) {
      throw new NotFoundException(`Course with code "${courseId}" not found or is inactive.`);
    }
    return course;
  }

  async delete(id: number): Promise<void> {
    const result = await this.courseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Course with DB ID ${id} not found`);
    }
  }
}
