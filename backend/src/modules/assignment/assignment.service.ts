import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiEvaluationService } from '../ai-evaluation/services/ai-evaluation.service';

@Injectable()
export class AssignmentService {
  constructor(
    private prisma: PrismaService,
    private aiEvaluationService: AiEvaluationService,
  ) {}

  async create(
    courseId: string,
    title: string,
    description?: string,
    deadline?: Date,
    instructions?: string,
    expectedOutcome?: string,
    rubric?: any,
    maxMarks?: number,
  ): Promise<any> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.prisma.assignment.create({
      data: {
        title,
        description,
        instructions,
        expectedOutcome,
        rubric: rubric ? (typeof rubric === 'string' ? JSON.parse(rubric) : rubric) : undefined,
        maxMarks: maxMarks ? parseFloat(maxMarks as any) : 100,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        courseId,
      },
    });
  }

  async getAssignmentsByCourse(courseId: string): Promise<any[]> {
    const whereCondition: any = {};
    if (courseId && courseId !== 'all' && courseId.trim() !== '') {
      whereCondition.OR = [
        { courseId: courseId },
        { course: { id: courseId } },
        { course: { courseId: { equals: courseId, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.assignment.findMany({
      where: whereCondition,
      include: { course: true },
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

    const submission = await this.prisma.assignmentSubmission.create({
      data: {
        studentName,
        collegeName,
        fileName: file.originalname,
        fileUrl: file.path.replace(/\\/g, '/'),
        assignmentId,
        currentStatus: 'PENDING',
      },
      include: {
        assignment: true,
      },
    });

    // Trigger async AI Evaluation Queue (Student upload returns immediately!)
    this.aiEvaluationService.triggerAsyncEvaluation(submission.id).catch((err) => {
      console.error(`Background AI trigger error for submission ${submission.id}:`, err);
    });

    return submission;
  }

  async getSubmissions(courseId?: string): Promise<any[]> {
    const whereCondition: any = {};
    if (courseId && courseId !== 'all' && courseId.trim() !== '') {
      whereCondition.assignment = {
        OR: [
          { courseId: courseId },
          { course: { id: courseId } },
          { course: { courseId: { equals: courseId, mode: 'insensitive' } } },
        ],
      };
    }

    return this.prisma.assignmentSubmission.findMany({
      where: whereCondition,
      include: {
        assignment: {
          include: { course: true },
        },
        evaluations: {
          orderBy: { version: 'desc' },
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
        evaluations: {
          orderBy: { version: 'desc' },
        },
      },
    });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }

  async gradeSubmission(id: string, marks: number, feedback: string): Promise<any> {
    const submission = await this.getSubmission(id);
    return this.prisma.assignmentSubmission.update({
      where: { id },
      data: {
        marks: parseFloat(marks as any),
        feedback,
        currentStatus: 'PUBLISHED',
        publishedAt: new Date(),
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
        evaluations: {
          orderBy: { version: 'desc' },
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
    if (attrs.instructions !== undefined) data.instructions = attrs.instructions;
    if (attrs.expectedOutcome !== undefined) data.expectedOutcome = attrs.expectedOutcome;
    if (attrs.rubric !== undefined) data.rubric = typeof attrs.rubric === 'string' ? JSON.parse(attrs.rubric) : attrs.rubric;
    if (attrs.maxMarks !== undefined) data.maxMarks = parseFloat(attrs.maxMarks as any);
    if (attrs.deadline !== undefined) data.deadline = new Date(attrs.deadline);

    return this.prisma.assignment.update({
      where: { id },
      data,
    });
  }
}
