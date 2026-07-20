import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    courseId: string;
    question: string;
    questionType: string;
    difficulty: string;
    explanation?: string;
    caseSensitive?: boolean;
    sampleAnswer?: string;
    correctAnswerText?: string;
    options?: { optionText: string; isCorrect: boolean }[];
  }) {
    return this.prisma.questionBank.create({
      data: {
        courseId: data.courseId,
        question: data.question,
        questionType: data.questionType,
        difficulty: data.difficulty,
        explanation: data.explanation || null,
        caseSensitive: data.caseSensitive || false,
        sampleAnswer: data.sampleAnswer || null,
        correctAnswerText: data.correctAnswerText || null,
        options: data.options
          ? {
              create: data.options.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })),
            }
          : undefined,
      },
      include: {
        options: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      question?: string;
      questionType?: string;
      difficulty?: string;
      explanation?: string;
      caseSensitive?: boolean;
      sampleAnswer?: string;
      correctAnswerText?: string;
      options?: { optionText: string; isCorrect: boolean }[];
    },
  ) {
    const existing = await this.prisma.questionBank.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!existing) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // If options are provided, delete the old ones first
    if (data.options) {
      await this.prisma.questionOption.deleteMany({
        where: { questionId: id },
      });
    }

    return this.prisma.questionBank.update({
      where: { id },
      data: {
        question: data.question !== undefined ? data.question : existing.question,
        questionType: data.questionType !== undefined ? data.questionType : existing.questionType,
        difficulty: data.difficulty !== undefined ? data.difficulty : existing.difficulty,
        explanation: data.explanation !== undefined ? data.explanation : existing.explanation,
        caseSensitive: data.caseSensitive !== undefined ? data.caseSensitive : existing.caseSensitive,
        sampleAnswer: data.sampleAnswer !== undefined ? data.sampleAnswer : existing.sampleAnswer,
        correctAnswerText: data.correctAnswerText !== undefined ? data.correctAnswerText : existing.correctAnswerText,
        options: data.options
          ? {
              create: data.options.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })),
            }
          : undefined,
      },
      include: {
        options: true,
      },
    });
  }

  async findFiltered(query: {
    courseId?: string;
    difficulty?: string;
    questionType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { status: 'Active' };

    if (query.courseId) {
      where.courseId = query.courseId;
    }
    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }
    if (query.questionType) {
      where.questionType = query.questionType;
    }
    if (query.search) {
      where.question = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.questionBank.count({ where }),
      this.prisma.questionBank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { options: true },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.questionBank.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async delete(id: string) {
    const question = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // Soft delete by marking as Inactive
    return this.prisma.questionBank.update({
      where: { id },
      data: { status: 'Inactive' },
    });
  }
}
