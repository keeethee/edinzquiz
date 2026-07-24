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

  async importQuestions(file: Express.Multer.File, courseId: string) {
    const XLSX = await import('xlsx');
    
    if (!file || !file.buffer) {
      throw new Error('No file uploaded or file buffer is empty');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const totalRows = rows.length;
    const errors: { row: number; message: string }[] = [];
    const questions: any[] = [];
    const seenQuestionTexts = new Set<string>();

    const existingDbQuestions = await this.prisma.questionBank.findMany({
      where: { courseId, status: 'Active' },
      select: { question: true },
    });
    const dbQuestionTexts = new Set(existingDbQuestions.map(q => q.question.toLowerCase().trim()));

    const questions: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row numbering starts at 1 (header is row 1)

      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.trim().toLowerCase()] = String(row[key]).trim();
      });

      const questionText = normalizedRow['question'] || '';
      if (!questionText || questionText.trim() === '') {
        // Skip purely blank rows (like Row 3) silently
        continue;
      }

      const questionTextLower = questionText.toLowerCase().trim();
      const isDuplicateInDb = dbQuestionTexts.has(questionTextLower);

      const correctAnswerRaw = normalizedRow['correct answer'] || normalizedRow['correct_answer'] || normalizedRow['answer'] || '';

      let qType = normalizedRow['question type'] || normalizedRow['questiontype'] || normalizedRow['type'] || 'MCQ_SINGLE';
      qType = qType.toUpperCase().replace(/\s+/g, '_');
      if (qType === 'MCQ' || qType === 'SINGLE') qType = 'MCQ_SINGLE';
      if (qType === 'MULTIPLE' || qType === 'MCQ_MULTIPLE') qType = 'MCQ_MULTIPLE';
      if (qType === 'TRUE/FALSE' || qType === 'TRUE_FALSE') qType = 'TF';
      
      const supportedTypes = ['MCQ_SINGLE', 'MCQ_MULTIPLE', 'TF', 'FILL_BLANK', 'SHORT_ANSWER', 'ESSAY'];
      if (!supportedTypes.includes(qType)) {
        qType = 'MCQ_SINGLE'; // Safe default
      }

      let difficulty = normalizedRow['difficulty'] || 'Medium';
      difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
      if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        difficulty = 'Medium';
      }

      const marksVal = normalizedRow['marks'] !== undefined && normalizedRow['marks'] !== '' ? Number(normalizedRow['marks']) : 1;
      const validMarks = isNaN(marksVal) || marksVal <= 0 ? 1 : marksVal;

      const explanation = normalizedRow['explanation'] || '';
      const sampleAnswer = normalizedRow['sample answer'] || normalizedRow['sample_answer'] || '';
      const correctAnswerText = normalizedRow['correct answer text'] || normalizedRow['correct_answer_text'] || '';

      const optionA = row['Option A'] || row['option A'] || row['option a'] || row['Option 1'] || row['option 1'] || '';
      const optionB = row['Option B'] || row['option B'] || row['option b'] || row['Option 2'] || row['option 2'] || '';
      const optionC = row['Option C'] || row['option C'] || row['option c'] || row['Option 3'] || row['option 3'] || '';
      const optionD = row['Option D'] || row['option D'] || row['option d'] || row['Option 4'] || row['option 4'] || '';

      const options: { optionText: string; isCorrect: boolean; key: string }[] = [];
      if (optionA) options.push({ optionText: String(optionA).trim(), isCorrect: false, key: 'A' });
      if (optionB) options.push({ optionText: String(optionB).trim(), isCorrect: false, key: 'B' });
      if (optionC) options.push({ optionText: String(optionC).trim(), isCorrect: false, key: 'C' });
      if (optionD) options.push({ optionText: String(optionD).trim(), isCorrect: false, key: 'D' });

      if (qType === 'TF' && options.length === 0) {
        options.push({ optionText: 'True', isCorrect: false, key: 'A' });
        options.push({ optionText: 'False', isCorrect: false, key: 'B' });
      }

      // Flexible answer key matching (A/B/C/D, 1/2/3/4, Option A, True/False, or text match)
      const rawAnsTokens = String(correctAnswerRaw)
        .split(/[;,]+/)
        .map(s => s.trim().toUpperCase());

      let matchedCorrectCount = 0;
      options.forEach(opt => {
        const optKey = opt.key; // 'A', 'B', 'C', 'D'
        const optNum = optKey === 'A' ? '1' : optKey === 'B' ? '2' : optKey === 'C' ? '3' : '4';
        const optTextUpper = opt.optionText.toUpperCase();

        const isMatch = rawAnsTokens.some(token => {
          if (!token) return false;
          if (token === optKey || token === `OPTION ${optKey}` || token === `OPTION${optKey}`) return true;
          if (token === optNum || token === `OPTION ${optNum}` || token === `OPTION${optNum}`) return true;
          if (token === optTextUpper) return true;
          if (qType === 'TF') {
            if ((optKey === 'A' || optTextUpper === 'TRUE') && (token === 'TRUE' || token === 'T')) return true;
            if ((optKey === 'B' || optTextUpper === 'FALSE') && (token === 'FALSE' || token === 'F')) return true;
          }
          return false;
        });

        if (isMatch) {
          opt.isCorrect = true;
          matchedCorrectCount++;
        }
      });

      // Fallback: If objective question has options but no match was detected, default Option A to true so question is never lost
      if (['MCQ_SINGLE', 'MCQ_MULTIPLE', 'TF'].includes(qType) && options.length > 0 && matchedCorrectCount === 0) {
        options[0].isCorrect = true;
      }

      const parsedQuestion = {
        question: questionText,
        questionType: qType,
        difficulty,
        marks: validMarks,
        mark: validMarks,
        explanation,
        sampleAnswer: sampleAnswer || correctAnswerText || correctAnswerRaw,
        correctAnswerText: correctAnswerText || correctAnswerRaw,
        options: options.map(o => ({ optionText: o.optionText, isCorrect: o.isCorrect })),
        isDuplicateInDb,
      };

      questions.push(parsedQuestion);
    }

    const successCount = questions.length;
    const failedCount = errors.length;

    return {
      totalRows,
      successCount,
      failedCount,
      questions,
      errors,
    };
  }

  async bulkSave(courseId: string, questions: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const savedQuestions = [];
      for (const q of questions) {
        const qTextLower = q.question.trim().toLowerCase();
        
        const existing = await tx.questionBank.findFirst({
          where: {
            courseId,
            question: {
              equals: q.question.trim(),
              mode: 'insensitive',
            },
          },
        });

        if (existing) {
          // Overwrite options & update fields to maintain single clean copy
          await tx.option.deleteMany({ where: { questionId: existing.id } });
          const updated = await tx.questionBank.update({
            where: { id: existing.id },
            data: {
              questionType: q.questionType,
              difficulty: q.difficulty,
              explanation: q.explanation || null,
              caseSensitive: q.caseSensitive || false,
              sampleAnswer: q.sampleAnswer || null,
              correctAnswerText: q.correctAnswerText || null,
              options: q.options && q.options.length > 0
                ? {
                    create: q.options.map((opt: any) => ({
                      optionText: opt.optionText,
                      isCorrect: opt.isCorrect,
                    })),
                  }
                : undefined,
            },
            include: { options: true },
          });
          savedQuestions.push(updated);
        } else {
          const created = await tx.questionBank.create({
            data: {
              courseId,
              question: q.question,
              questionType: q.questionType,
              difficulty: q.difficulty,
              explanation: q.explanation || null,
              caseSensitive: q.caseSensitive || false,
              sampleAnswer: q.sampleAnswer || null,
              correctAnswerText: q.correctAnswerText || null,
              options: q.options && q.options.length > 0
                ? {
                    create: q.options.map((opt: any) => ({
                      optionText: opt.optionText,
                      isCorrect: opt.isCorrect,
                    })),
                  }
                : undefined,
            },
            include: { options: true },
          });
          savedQuestions.push(created);
        }
      }
      return savedQuestions;
    });
  }
}
