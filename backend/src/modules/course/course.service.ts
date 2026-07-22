import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async create(courseId: string, courseName: string, duration?: string, status: string = 'Active'): Promise<any> {
    const existing = await this.prisma.course.findUnique({ where: { courseId } });
    if (existing) {
      throw new ConflictException(`Course with display ID "${courseId}" already exists.`);
    }

    return this.prisma.course.create({
      data: {
        courseId,
        courseName,
        duration: duration || '',
        status,
      },
    });
  }

  async update(id: string, courseId: string, courseName: string, duration?: string, status?: string): Promise<any> {
    const course = await this.findOne(id);
    
    if (course.courseId !== courseId) {
      const existing = await this.prisma.course.findUnique({ where: { courseId } });
      if (existing) {
        throw new ConflictException(`Course with display ID "${courseId}" already exists.`);
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        courseId,
        courseName,
        duration: duration !== undefined ? duration : course.duration,
        status: status !== undefined ? status : course.status,
      },
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<any> {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course with DB ID ${id} not found`);
    }
    return course;
  }

  async findByCourseId(courseId: string): Promise<any> {
    const course = await this.prisma.course.findFirst({
      where: {
        courseId: { equals: courseId, mode: 'insensitive' },
        status: 'Active',
      },
    });
    if (!course) {
      throw new NotFoundException(`Course with code "${courseId}" not found or is inactive.`);
    }
    return course;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.course.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Course with DB ID ${id} not found`);
    }
  }
}
