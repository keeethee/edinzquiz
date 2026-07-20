import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssignmentService {
  constructor(private prisma: PrismaService) {}

  async create(courseId: string, title: string, description: string, deadline: Date): Promise<any> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.prisma.assignment.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        courseId,
      },
    });
  }

  async getAssignmentsByCourse(courseId: string): Promise<any[]> {
    return this.prisma.assignment.findMany({
      where: { courseId },
      orderBy: { deadline: 'asc' },
    });
  }

  async findOne(id: string): Promise<any> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.assignment.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
  }

  async submitAssignment(
    courseId: string,
    studentName: string,
    collegeName: string,
    assignmentId: string,
    file: Express.Multer.File,
  ): Promise<any> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    return this.prisma.assignmentSubmission.create({
      data: {
        studentName,
        collegeName,
        fileName: file.originalname,
        fileUrl: file.path.replace(/\\/g, '/'),
        assignmentId,
      },
    });
  }

  async getSubmissions(): Promise<any[]> {
    return this.prisma.assignmentSubmission.findMany({
      include: {
        assignment: {
          include: { course: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getSubmission(id: string): Promise<any> {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: { course: true },
        },
      },
    });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }

  async gradeSubmission(id: string, marks: number, feedback: string): Promise<any> {
    const submission = await this.findOne(id);
    return this.prisma.assignmentSubmission.update({
      where: { id },
      data: {
        marks: parseFloat(marks as any),
        feedback,
      },
    });
  }

  async getStudentSubmissions(studentName: string, collegeName: string): Promise<any[]> {
    return this.prisma.assignmentSubmission.findMany({
      where: { studentName, collegeName },
      include: {
        assignment: {
          include: { course: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async updateAssignment(id: string, attrs: any): Promise<any> {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    const data: any = {};
    if (attrs.title !== undefined) data.title = attrs.title;
    if (attrs.description !== undefined) data.description = attrs.description;
    if (attrs.deadline !== undefined) data.deadline = new Date(attrs.deadline);

    return this.prisma.assignment.update({
      where: { id },
      data,
    });
  }
}
