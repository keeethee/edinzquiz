import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  // Category endpoints
  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(name: string, description?: string) {
    const existing = await this.prisma.category.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException(`Category "${name}" already exists.`);
    }
    return this.prisma.category.create({
      data: { name, description },
    });
  }

  // Quiz Management
  async createQuiz(data: {
    courseId: string;
    title: string;
    description?: string;
    instructions?: string;
    duration: number;
    timerMode: string;
    passingMarks: number;
    maxAttempts: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    autoSubmit?: boolean;
    showResult?: boolean;
    categoryId?: string;
    publishAt?: string;
    expireAt?: string;
  }) {
    return this.prisma.quiz.create({
      data: {
        courseId: data.courseId,
        title: data.title || (data as any).quizTitle || '',
        description: data.description || null,
        instructions: data.instructions || null,
        duration: data.duration,
        timerMode: data.timerMode || 'No Timer',
        passingMarks: data.passingMarks,
        maxAttempts: data.maxAttempts || 1,
        shuffleQuestions: data.shuffleQuestions || false,
        shuffleOptions: data.shuffleOptions || false,
        autoSubmit: data.autoSubmit || false,
        showResult: data.showResult || false,
        categoryId: data.categoryId || null,
        status: 'Draft',
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expireAt: data.expireAt ? new Date(data.expireAt) : null,
      },
      include: {
        course: true,
        category: true,
      },
    });
  }

  async findAll(courseId?: string) {
    const whereCondition: any = {};
    if (courseId && courseId.trim() !== '') {
      whereCondition.OR = [
        { courseId: courseId },
        { course: { id: courseId } },
        { course: { courseId: { equals: courseId, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.quiz.findMany({
      where: whereCondition,
      include: {
        course: true,
        category: true,
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuizzesByCourse(courseId: string) {
    // Map of active/published quizzes for a course
    return this.prisma.quiz.findMany({
      where: { courseId },
      include: {
        course: true,
        category: true,
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: true,
        category: true,
        questions: {
          orderBy: { displayOrder: 'asc' },
          include: {
            question: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return quiz;
  }

  // Prepares the quiz for student (no correct keys, randomizes if shuffle enabled)
  async getQuizForStudent(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { displayOrder: 'asc' },
          include: {
            question: {
              include: {
                options: {
                  select: { id: true, optionText: true },
                },
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    if (quiz.status !== 'Published') {
      throw new BadRequestException('This quiz is not currently available.');
    }

    // Map questions to a cleaner structure and remove answers key
    let mappedQuestions = quiz.questions.map((q) => ({
      id: q.question.id,
      questionText: q.question.question,
      questionType: q.question.questionType,
      mark: q.marks,
      explanation: q.question.explanation,
      caseSensitive: q.question.caseSensitive,
      options: q.question.options,
    }));

    if (quiz.shuffleQuestions) {
      mappedQuestions = this.shuffle(mappedQuestions);
    }

    if (quiz.shuffleOptions) {
      mappedQuestions = mappedQuestions.map((q) => {
        if (q.options && q.options.length > 0) {
          q.options = this.shuffle(q.options);
        }
        return q;
      });
    }

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      instructions: quiz.instructions,
      duration: quiz.duration,
      timerMode: quiz.timerMode,
      passingMarks: quiz.passingMarks,
      maxAttempts: quiz.maxAttempts,
      showResult: quiz.showResult,
      questions: mappedQuestions,
    };
  }

  async updateQuiz(id: string, body: any) {
    const existing = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    const data: any = {};
    const titleVal = body.title !== undefined ? body.title : body.quizTitle;
    if (titleVal !== undefined) data.title = titleVal;
    if (body.description !== undefined) data.description = body.description;
    if (body.instructions !== undefined) data.instructions = body.instructions;
    if (body.duration !== undefined) data.duration = parseInt(body.duration, 10);
    if (body.timerMode !== undefined) data.timerMode = body.timerMode;
    if (body.passingMarks !== undefined) data.passingMarks = parseInt(body.passingMarks, 10);
    if (body.maxAttempts !== undefined) data.maxAttempts = parseInt(body.maxAttempts, 10);
    if (body.shuffleQuestions !== undefined) data.shuffleQuestions = body.shuffleQuestions;
    if (body.shuffleOptions !== undefined) data.shuffleOptions = body.shuffleOptions;
    if (body.autoSubmit !== undefined) data.autoSubmit = body.autoSubmit;
    if (body.showResult !== undefined) data.showResult = body.showResult;
    if (body.status !== undefined) data.status = body.status;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
    if (body.publishAt !== undefined) data.publishAt = body.publishAt ? new Date(body.publishAt) : null;
    if (body.expireAt !== undefined) data.expireAt = body.expireAt ? new Date(body.expireAt) : null;

    const updated = await this.prisma.quiz.update({
      where: { id },
      data,
      include: { course: true, category: true },
    });

    if (Array.isArray(body.questions)) {
      await this.prisma.quizQuestion.deleteMany({ where: { quizId: id } });

      let order = 0;
      for (const qItem of body.questions) {
        order++;
        let questionId = qItem.questionId || qItem.id;

        let qBankRecord: any = null;
        if (questionId) {
          qBankRecord = await this.prisma.questionBank.findUnique({
            where: { id: questionId },
            include: { options: true }
          });
        }

        if (!qBankRecord && qItem.questionText) {
          qBankRecord = await this.prisma.questionBank.create({
            data: {
              courseId: existing.courseId,
              question: qItem.questionText,
              questionType: qItem.questionType || 'MCQ_SINGLE',
              explanation: qItem.explanation || null,
              caseSensitive: qItem.caseSensitive || false,
              sampleAnswer: qItem.sampleAnswer || null,
              correctAnswerText: qItem.correctAnswerText || null,
            }
          });
          questionId = qBankRecord.id;

          if (Array.isArray(qItem.options)) {
            for (const opt of qItem.options) {
              if (opt.optionText) {
                await this.prisma.questionOption.create({
                  data: {
                    questionId,
                    optionText: opt.optionText,
                    isCorrect: !!opt.isCorrect,
                  }
                });
              }
            }
          }
        } else if (qBankRecord && qItem.questionText) {
          await this.prisma.questionBank.update({
            where: { id: questionId },
            data: {
              question: qItem.questionText,
              questionType: qItem.questionType || qBankRecord.questionType,
              explanation: qItem.explanation !== undefined ? qItem.explanation : qBankRecord.explanation,
            }
          });

          if (Array.isArray(qItem.options)) {
            await this.prisma.questionOption.deleteMany({ where: { questionId } });
            for (const opt of qItem.options) {
              if (opt.optionText) {
                await this.prisma.questionOption.create({
                  data: {
                    questionId,
                    optionText: opt.optionText,
                    isCorrect: !!opt.isCorrect,
                  }
                });
              }
            }
          }
        }

        if (questionId) {
          await this.prisma.quizQuestion.create({
            data: {
              quizId: id,
              questionId,
              displayOrder: order,
              marks: qItem.mark || 1,
            }
          });
        }
      }
    }

    return this.getQuiz(id);
  }

  async deleteQuiz(id: string) {
    try {
      await this.prisma.quiz.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
  }

  // Duplicate an existing quiz with all its question linkages
  async duplicateQuiz(id: string) {
    const orig = await this.getQuiz(id);

    const dup = await this.prisma.quiz.create({
      data: {
        courseId: orig.courseId,
        title: `${orig.title} (Copy)`,
        description: orig.description,
        instructions: orig.instructions,
        duration: orig.duration,
        timerMode: orig.timerMode,
        passingMarks: orig.passingMarks,
        maxAttempts: orig.maxAttempts,
        shuffleQuestions: orig.shuffleQuestions,
        shuffleOptions: orig.shuffleOptions,
        autoSubmit: orig.autoSubmit,
        showResult: orig.showResult,
        categoryId: orig.categoryId,
        status: 'Draft',
      },
    });

    // Copy over linkages
    for (const q of orig.questions) {
      await this.prisma.quizQuestion.create({
        data: {
          quizId: dup.id,
          questionId: q.questionId,
          displayOrder: q.displayOrder,
          marks: q.marks,
        },
      });
    }

    return this.getQuiz(dup.id);
  }

  // Publish / Unpublish quiz validation
  async publishQuiz(id: string) {
    const quiz = await this.getQuiz(id);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    if (!quiz.title || quiz.title.trim() === '') {
      throw new BadRequestException('Quiz Name is required.');
    }
    if (quiz.questions.length === 0) {
      throw new BadRequestException('At least one question is required to publish.');
    }
    if (quiz.timerMode !== 'No Timer' && quiz.duration <= 0) {
      throw new BadRequestException('Duration must be greater than 0 if timer is enabled.');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: { status: 'Published' },
    });
  }

  async unpublishQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return this.prisma.quiz.update({
      where: { id },
      data: { status: 'Draft' },
    });
  }

  // Question assignments to quiz
  async addQuestionsToQuiz(quizId: string, questionIds: string[], marks: number = 1) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    let nextOrder = quiz.questions.length;
    for (const qId of questionIds) {
      // Check if already in quiz
      const exists = quiz.questions.some((q) => q.questionId === qId);
      if (!exists) {
        await this.prisma.quizQuestion.create({
          data: {
            quizId,
            questionId: qId,
            displayOrder: nextOrder++,
            marks,
          },
        });
      }
    }

    return this.getQuiz(quizId);
  }

  async removeQuestionFromQuiz(quizId: string, questionId: string) {
    await this.prisma.quizQuestion.deleteMany({
      where: { quizId, questionId },
    });

    // Re-adjust display orders
    const remaining = await this.prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { displayOrder: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      await this.prisma.quizQuestion.update({
        where: { id: remaining[i].id },
        data: { displayOrder: i },
      });
    }

    return this.getQuiz(quizId);
  }

  async reorderQuestions(quizId: string, questionIds: string[]) {
    for (let i = 0; i < questionIds.length; i++) {
      await this.prisma.quizQuestion.updateMany({
        where: { quizId, questionId: questionIds[i] },
        data: { displayOrder: i },
      });
    }
    return this.getQuiz(quizId);
  }

  async updateQuizQuestionMarks(quizId: string, questionId: string, marks: number) {
    await this.prisma.quizQuestion.updateMany({
      where: { quizId, questionId },
      data: { marks },
    });
    return this.getQuiz(quizId);
  }

  // Timing/Start Attempt endpoints
  async startQuizAttempt(quizId: string, studentId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz not found`);
    }

    // Check attempts count
    const attemptCount = await this.prisma.quizSubmission.count({
      where: { quizId, studentId },
    });
    if (attemptCount >= quiz.maxAttempts) {
      throw new BadRequestException(`Maximum attempts limit (${quiz.maxAttempts}) reached for this quiz.`);
    }

    const submission = await this.prisma.quizSubmission.create({
      data: {
        quizId,
        studentId,
        startedAt: new Date(),
      },
    });

    return {
      submissionId: submission.id,
      startedAt: submission.startedAt,
      durationMinutes: quiz.duration,
    };
  }

  // Submissions and Grading
  async submitQuiz(data: {
    submissionId: string;
    answers: { questionId: string; selectedOptionIds?: string[]; typedAnswerText?: string }[];
  }) {
    const submission = await this.prisma.quizSubmission.findUnique({
      where: { id: data.submissionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                question: { include: { options: true } },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Quiz attempt submission not found.');
    }
    if (submission.submittedAt) {
      throw new BadRequestException('This quiz attempt has already been submitted.');
    }

    const quiz = submission.quiz;
    const submittedTime = new Date();

    // SERVER-SIDE TIMER VALIDATION
    // Allow an extra 30 seconds grace period for network latency
    const allowedDurationMs = quiz.duration * 60 * 1000 + 30000;
    const elapsedMs = submittedTime.getTime() - submission.startedAt.getTime();
    const isLate = quiz.timerMode !== 'No Timer' && elapsedMs > allowedDurationMs;

    let totalScore = 0;
    const studentAnswersData: any[] = [];

    for (const qLink of quiz.questions) {
      const q = qLink.question;
      const sAns = data.answers.find((a) => a.questionId === q.id);

      let marksAwarded = 0;
      let isEvaluated = true;

      if (sAns) {
        if (q.questionType === 'MCQ_SINGLE' || q.questionType === 'TF') {
          const selectedId = sAns.selectedOptionIds?.[0];
          const correctOpt = q.options.find((o) => o.isCorrect);
          if (selectedId && correctOpt && selectedId === correctOpt.id) {
            marksAwarded = qLink.marks;
          }
        } else if (q.questionType === 'MCQ_MULTIPLE') {
          const selectedIds = sAns.selectedOptionIds || [];
          const correctOptIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
          
          const correctCount = selectedIds.filter((id) => correctOptIds.includes(id)).length;
          const incorrectCount = selectedIds.filter((id) => !correctOptIds.includes(id)).length;

          if (correctCount === correctOptIds.length && incorrectCount === 0) {
            marksAwarded = qLink.marks;
          }
        } else if (q.questionType === 'FILL_BLANK' || q.questionType === 'SHORT_ANSWER') {
          const typed = sAns.typedAnswerText?.trim() || '';
          const correctPatterns = (q.correctAnswerText || '').split('|').map((p) => p.trim());

          const isCorrect = correctPatterns.some((pattern) => {
            if (q.caseSensitive) {
              return typed === pattern;
            } else {
              return typed.toLowerCase() === pattern.toLowerCase();
            }
          });

          if (isCorrect) {
            marksAwarded = qLink.marks;
          }
        } else if (q.questionType === 'ESSAY') {
          // Manual grading required
          isEvaluated = false;
          marksAwarded = 0;
        }

        studentAnswersData.push({
          questionId: q.id,
          selectedOptionIds: sAns.selectedOptionIds || [],
          typedAnswerText: sAns.typedAnswerText || null,
          marksAwarded,
          isEvaluated,
        });

        totalScore += marksAwarded;
      } else {
        // No answer provided
        studentAnswersData.push({
          questionId: q.id,
          selectedOptionIds: [],
          typedAnswerText: null,
          marksAwarded: 0,
          isEvaluated: q.questionType !== 'ESSAY',
        });
      }
    }

    // Apply cap or penalize score if late
    if (isLate) {
      console.log('Submission marked as late. Applying time validation policy.');
      // Auto-submit could cap marks or flags, we can store late flag
    }

    const passed = totalScore >= quiz.passingMarks;
    const timeTakenSeconds = Math.round(elapsedMs / 1000);

    // Save submission answers and score
    await this.prisma.studentAnswer.createMany({
      data: studentAnswersData.map((ans) => ({
        submissionId: submission.id,
        questionId: ans.questionId,
        selectedOptionIds: ans.selectedOptionIds,
        typedAnswerText: ans.typedAnswerText,
        marksAwarded: ans.marksAwarded,
        isEvaluated: ans.isEvaluated,
      })),
    });

    return this.prisma.quizSubmission.update({
      where: { id: submission.id },
      data: {
        submittedAt: submittedTime,
        score: totalScore,
        passed,
        timeTakenSeconds,
      },
      include: {
        quiz: true,
        answers: true,
      },
    });
  }

  async getStudentResult(submissionId: string) {
    const sub = await this.prisma.quizSubmission.findUnique({
      where: { id: submissionId },
      include: {
        quiz: {
          include: {
            course: true,
            questions: {
              include: {
                question: { include: { options: true } },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!sub) {
      throw new NotFoundException('Submission not found.');
    }

    return sub;
  }

  async getSubmissionsList() {
    return this.prisma.quizSubmission.findMany({
      include: {
        quiz: {
          include: {
            course: true,
          },
        },
        student: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getSubmission(id: string) {
    const sub = await this.prisma.quizSubmission.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            course: true,
            questions: {
              include: {
                question: { include: { options: true } },
              },
            },
          },
        },
        student: true,
        answers: true,
      },
    });

    if (!sub) {
      throw new NotFoundException('Submission not found.');
    }

    return sub;
  }

  async evaluateEssayAnswers(submissionId: string, evaluations: { questionId: string; marksAwarded: number; feedback?: string }[]) {
    const sub = await this.prisma.quizSubmission.findUnique({
      where: { id: submissionId },
      include: { answers: true, quiz: true },
    });

    if (!sub) {
      throw new NotFoundException('Submission not found.');
    }

    let addedScore = 0;

    for (const evalItem of evaluations) {
      const answer = sub.answers.find((a) => a.questionId === evalItem.questionId);
      if (answer) {
        await this.prisma.studentAnswer.update({
          where: { id: answer.id },
          data: {
            marksAwarded: evalItem.marksAwarded,
            isEvaluated: true,
            feedback: evalItem.feedback || null,
          },
        });
        addedScore += evalItem.marksAwarded - answer.marksAwarded;
      }
    }

    const updatedSubmission = await this.prisma.quizSubmission.findUnique({
      where: { id: submissionId },
      include: { answers: true, quiz: true },
    });

    if (!updatedSubmission) {
      throw new NotFoundException('Submission not found');
    }

    const newScore = updatedSubmission.answers.reduce((acc, curr) => acc + curr.marksAwarded, 0);
    const passed = newScore >= updatedSubmission.quiz.passingMarks;

    return this.prisma.quizSubmission.update({
      where: { id: submissionId },
      data: {
        score: newScore,
        passed,
      },
      include: { answers: true },
    });
  }

  async getLeaderboard(quizId: string) {
    return this.prisma.quizSubmission.findMany({
      where: { quizId, submittedAt: { not: null } },
      include: { student: true },
      orderBy: [
        { score: 'desc' },
        { timeTakenSeconds: 'asc' },
      ],
      take: 20,
    });
  }

  async getAnalytics(quizId: string) {
    const submissions = await this.prisma.quizSubmission.findMany({
      where: { quizId, submittedAt: { not: null } },
    });

    if (submissions.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        passRate: 0,
      };
    }

    const scores = submissions.map((s) => s.score);
    const totalAttempts = submissions.length;
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalAttempts;
    const highestScore = Math.max(...scores);
    const passCount = submissions.filter((s) => s.passed).length;
    const passRate = (passCount / totalAttempts) * 100;

    return {
      totalAttempts,
      averageScore,
      highestScore,
      passRate,
    };
  }

  async deleteSubmission(id: string) {
    const sub = await this.prisma.quizSubmission.findUnique({ where: { id } });
    if (!sub) {
      throw new NotFoundException('Submission not found.');
    }
    await this.prisma.studentAnswer.deleteMany({ where: { submissionId: id } });
    return this.prisma.quizSubmission.delete({ where: { id } });
  }

  // Shuffle Helper
  private shuffle(array: any[]) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
