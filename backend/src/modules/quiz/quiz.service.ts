import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizEntity } from '../../entities/quiz.entity';
import { QuestionEntity } from '../../entities/question.entity';
import { OptionEntity } from '../../entities/option.entity';
import { QuizSubmissionEntity } from '../../entities/quiz-submission.entity';
import { StudentAnswerEntity } from '../../entities/student-answer.entity';
import { CourseEntity } from '../../entities/course.entity';
import { StudentEntity } from '../../entities/student.entity';
import { CategoryEntity } from '../../entities/category.entity';
import { QuizSettingsEntity } from '../../entities/quiz-settings.entity';
import { MediaAttachmentEntity } from '../../entities/media-attachment.entity';

@Injectable()
export class QuizService implements OnModuleInit {
  constructor(
    @InjectRepository(QuizEntity)
    private quizRepository: Repository<QuizEntity>,
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
    @InjectRepository(OptionEntity)
    private optionRepository: Repository<OptionEntity>,
    @InjectRepository(QuizSubmissionEntity)
    private submissionRepository: Repository<QuizSubmissionEntity>,
    @InjectRepository(StudentAnswerEntity)
    private studentAnswerRepository: Repository<StudentAnswerEntity>,
    @InjectRepository(CourseEntity)
    private courseRepository: Repository<CourseEntity>,
    @InjectRepository(StudentEntity)
    private studentRepository: Repository<StudentEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(QuizSettingsEntity)
    private settingsRepository: Repository<QuizSettingsEntity>,
    @InjectRepository(MediaAttachmentEntity)
    private mediaRepository: Repository<MediaAttachmentEntity>,
  ) {}

  async onModuleInit() {
    // Seed standard quiz categories if the database categories table is empty
    const count = await this.categoryRepository.count();
    if (count === 0) {
      const categories = [
        { name: 'Programming', description: 'Coding, scripts, and software engineering questions' },
        { name: 'Mathematics', description: 'Algebra, Geometry, Calculus, and logic formulas' },
        { name: 'General Science', description: 'Physics, Chemistry, and Biology assessment tasks' },
        { name: 'General', description: 'General Knowledge and general education trivia' },
        { name: 'Subjective Essay', description: 'Essay-based long form assessment tasks' },
      ];
      await this.categoryRepository.save(categories);
      console.log('Quiz categories successfully seeded!');
    }
  }

  // Categories operations
  async getCategories(): Promise<CategoryEntity[]> {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async createCategory(name: string, description?: string): Promise<CategoryEntity> {
    const existing = await this.categoryRepository.findOneBy({ name });
    if (existing) return existing;
    const cat = this.categoryRepository.create({ name, description });
    return this.categoryRepository.save(cat);
  }

  // Quiz CRUD & configurations
  async createQuiz(
    courseId: number,
    quizTitle: string,
    startTime: Date,
    endTime: Date,
    totalMarks: number,
    duration: number = 60,
    passingMarks: number = 40,
    negativeMarkingEnabled: boolean = false,
    negativeMarkingValue: number = 0,
    shuffleQuestions: boolean = false,
    shuffleOptions: boolean = false,
    description?: string,
    difficulty: string = 'Medium',
    categoryId?: number,
    settingsData?: { maxAttempts?: number; passingPercentage?: number; showResultsImmediately?: boolean }
  ): Promise<QuizEntity> {
    const course = await this.courseRepository.findOneBy({ id: courseId });
    if (!course) {
      throw new NotFoundException(`Course not found`);
    }

    let category = null;
    if (categoryId) {
      category = await this.categoryRepository.findOneBy({ id: categoryId });
    }

    const quiz = this.quizRepository.create({
      quizTitle,
      startTime,
      endTime,
      totalMarks,
      duration,
      passingMarks,
      negativeMarkingEnabled,
      negativeMarkingValue,
      shuffleQuestions,
      shuffleOptions,
      status: 'Draft',
      resultsPublished: false,
      description: description || null,
      difficulty,
      course,
      category,
    });

    const savedQuiz = await this.quizRepository.save(quiz);

    // Create 1-to-1 QuizSettings record
    const settings = this.settingsRepository.create({
      maxAttempts: settingsData?.maxAttempts ?? 1,
      passingPercentage: settingsData?.passingPercentage ?? 40,
      showResultsImmediately: settingsData?.showResultsImmediately ?? true,
      quiz: savedQuiz,
    });
    await this.settingsRepository.save(settings);

    return this.getQuiz(savedQuiz.id);
  }

  async getQuizzesByCourse(courseId: number): Promise<QuizEntity[]> {
    return this.quizRepository.find({
      where: { course: { id: courseId } },
      relations: { category: true, settings: true },
      order: { id: 'DESC' },
    });
  }

  async getQuiz(id: number): Promise<QuizEntity> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: { course: true, category: true, settings: true, questions: { options: true } },
      order: {
        questions: {
          orderIndex: 'ASC'
        }
      }
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz not found`);
    }

    // Eager seed settings for backwards compatibility
    if (!quiz.settings) {
      const settings = this.settingsRepository.create({
        maxAttempts: 1,
        passingPercentage: Math.round((quiz.passingMarks / (quiz.totalMarks || 100)) * 100),
        showResultsImmediately: true,
        quiz: quiz
      });
      quiz.settings = await this.settingsRepository.save(settings);
    }
    return quiz;
  }

  async updateTiming(
    id: number,
    startTime?: Date,
    endTime?: Date,
    status?: string,
    resultsPublished?: boolean,
  ): Promise<QuizEntity> {
    const quiz = await this.getQuiz(id);
    if (startTime) quiz.startTime = startTime;
    if (endTime) quiz.endTime = endTime;
    if (status) quiz.status = status;
    if (resultsPublished !== undefined) quiz.resultsPublished = resultsPublished;
    return this.quizRepository.save(quiz);
  }

  // Unified quiz settings update
  async updateQuiz(
    id: number,
    data: {
      quizTitle?: string;
      description?: string;
      difficulty?: string;
      startTime?: string;
      endTime?: string;
      status?: string;
      duration?: number;
      passingMarks?: number;
      negativeMarkingEnabled?: boolean;
      negativeMarkingValue?: number;
      shuffleQuestions?: boolean;
      shuffleOptions?: boolean;
      resultsPublished?: boolean;
      categoryId?: number;
      settings?: {
        maxAttempts?: number;
        passingPercentage?: number;
        showResultsImmediately?: boolean;
      };
      questions?: any[];
    }
  ): Promise<QuizEntity> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: { course: true, category: true, settings: true }
    });
    if (!quiz) throw new NotFoundException(`Quiz not found`);

    if (data.quizTitle !== undefined) quiz.quizTitle = data.quizTitle;
    if (data.description !== undefined) quiz.description = data.description || null;
    if (data.difficulty !== undefined) quiz.difficulty = data.difficulty;
    if (data.startTime !== undefined) quiz.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) quiz.endTime = new Date(data.endTime);
    if (data.status !== undefined) quiz.status = data.status;
    if (data.duration !== undefined) quiz.duration = data.duration;
    if (data.passingMarks !== undefined) quiz.passingMarks = data.passingMarks;
    if (data.negativeMarkingEnabled !== undefined) quiz.negativeMarkingEnabled = data.negativeMarkingEnabled;
    if (data.negativeMarkingValue !== undefined) quiz.negativeMarkingValue = data.negativeMarkingValue;
    if (data.shuffleQuestions !== undefined) quiz.shuffleQuestions = data.shuffleQuestions;
    if (data.shuffleOptions !== undefined) quiz.shuffleOptions = data.shuffleOptions;
    if (data.resultsPublished !== undefined) quiz.resultsPublished = data.resultsPublished;

    if (data.categoryId !== undefined) {
      if (data.categoryId) {
        const cat = await this.categoryRepository.findOneBy({ id: data.categoryId });
        quiz.category = cat;
      } else {
        quiz.category = null;
      }
    }

    const savedQuiz = await this.quizRepository.save(quiz);

    if (data.settings) {
      let settings = savedQuiz.settings;
      if (!settings) {
        settings = this.settingsRepository.create({ quiz: savedQuiz });
      }
      if (data.settings.maxAttempts !== undefined) settings.maxAttempts = data.settings.maxAttempts;
      if (data.settings.passingPercentage !== undefined) settings.passingPercentage = data.settings.passingPercentage;
      if (data.settings.showResultsImmediately !== undefined) settings.showResultsImmediately = data.settings.showResultsImmediately;
      await this.settingsRepository.save(settings);
    }

    if (data.questions !== undefined) {
      const existingQs = await this.questionRepository.find({
        where: { quiz: { id: quiz.id } },
        relations: { options: true }
      });
      
      const keepQIds: number[] = [];

      for (let idx = 0; idx < data.questions.length; idx++) {
        const nq = data.questions[idx];
        let qEntity = null;
        if (nq.id) {
          qEntity = existingQs.find(eq => eq.id === nq.id);
        }

        if (!qEntity) {
          qEntity = this.questionRepository.create({ quiz: savedQuiz });
        }

        qEntity.questionText = nq.questionText;
        qEntity.questionType = nq.questionType;
        qEntity.mark = nq.mark;
        qEntity.correctAnswerText = nq.correctAnswerText || null;
        qEntity.orderIndex = idx;
        qEntity.explanation = nq.explanation || null;
        qEntity.caseSensitive = nq.caseSensitive || false;
        qEntity.sampleAnswer = nq.sampleAnswer || null;

        const savedQ = await this.questionRepository.save(qEntity);
        keepQIds.push(savedQ.id);

        if (nq.options !== undefined) {
          const existingOpts = qEntity.options || [];
          if (existingOpts.length > 0) {
            await this.optionRepository.remove(existingOpts);
          }
          if (nq.options.length > 0) {
            const newOpts = nq.options.map((opt: any) => this.optionRepository.create({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              question: savedQ,
            }));
            await this.optionRepository.save(newOpts);
          }
        }
      }

      const deleteQs = existingQs.filter(eq => !keepQIds.includes(eq.id));
      if (deleteQs.length > 0) {
        await this.questionRepository.remove(deleteQs);
      }
    }

    // Automatically calculate and sync totalMarks
    await this.recalculateTotalMarks(savedQuiz.id);

    return this.getQuiz(savedQuiz.id);
  }

  async recalculateTotalMarks(quizId: number): Promise<number> {
    const questions = await this.questionRepository.find({
      where: { quiz: { id: quizId } }
    });
    const total = questions.reduce((sum, q) => sum + (q.mark || 0), 0);
    await this.quizRepository.update(quizId, { totalMarks: total });
    return total;
  }

  async deleteQuiz(id: number): Promise<void> {
    await this.quizRepository.delete(id);
  }

  // Quiz duplication logic
  async duplicateQuiz(id: number): Promise<QuizEntity> {
    const orig = await this.getQuiz(id);
    if (!orig) throw new NotFoundException('Quiz to duplicate not found');

    const duplicatedQuiz = this.quizRepository.create({
      quizTitle: `Copy of ${orig.quizTitle}`,
      description: orig.description,
      difficulty: orig.difficulty,
      startTime: orig.startTime,
      endTime: orig.endTime,
      status: 'Draft',
      totalMarks: orig.totalMarks,
      duration: orig.duration,
      passingMarks: orig.passingMarks,
      negativeMarkingEnabled: orig.negativeMarkingEnabled,
      negativeMarkingValue: orig.negativeMarkingValue,
      shuffleQuestions: orig.shuffleQuestions,
      shuffleOptions: orig.shuffleOptions,
      resultsPublished: false,
      course: orig.course,
      category: orig.category,
    });

    const savedQuiz = await this.quizRepository.save(duplicatedQuiz);

    // Duplicate settings 1-to-1
    const origSettings = orig.settings;
    const settings = this.settingsRepository.create({
      maxAttempts: origSettings?.maxAttempts ?? 1,
      passingPercentage: origSettings?.passingPercentage ?? 40,
      showResultsImmediately: origSettings?.showResultsImmediately ?? true,
      quiz: savedQuiz,
    });
    await this.settingsRepository.save(settings);

    // Duplicate questions and options
    if (orig.questions && orig.questions.length > 0) {
      for (const q of orig.questions) {
        const dupQ = this.questionRepository.create({
          questionText: q.questionText,
          questionType: q.questionType,
          mark: q.mark,
          correctAnswerText: q.correctAnswerText,
          orderIndex: q.orderIndex,
          explanation: q.explanation,
          caseSensitive: q.caseSensitive,
          sampleAnswer: q.sampleAnswer,
          quiz: savedQuiz,
        });
        const savedQ = await this.questionRepository.save(dupQ);

        if (q.options && q.options.length > 0) {
          const dupOpts = q.options.map(opt => this.optionRepository.create({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            question: savedQ,
          }));
          await this.optionRepository.save(dupOpts);
        }
      }
    }

    return this.getQuiz(savedQuiz.id);
  }

  // Question & Option CRUD & updates
  async addQuestion(
    quizId: number,
    questionText: string,
    questionType: string,
    mark: number,
    correctAnswerText?: string,
    optionsData?: { optionText: string; isCorrect: boolean }[],
  ): Promise<QuestionEntity> {
    const quiz = await this.quizRepository.findOneBy({ id: quizId });
    if (!quiz) throw new NotFoundException(`Quiz not found`);

    const count = await this.questionRepository.countBy({ quiz: { id: quizId } });

    const question = this.questionRepository.create({
      questionText,
      questionType,
      mark,
      correctAnswerText: correctAnswerText || null,
      orderIndex: count,
      quiz,
    });

    const savedQuestion = await this.questionRepository.save(question);

    if (optionsData && optionsData.length > 0) {
      const options = optionsData.map(opt => this.optionRepository.create({
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        question: savedQuestion,
      }));
      await this.optionRepository.save(options);
    }

    await this.recalculateTotalMarks(quizId);
    return this.getQuestion(savedQuestion.id);
  }

  async getQuestion(id: number): Promise<QuestionEntity> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: { options: true },
    });
    if (!question) throw new NotFoundException(`Question not found`);
    return question;
  }

  async updateQuestion(
    id: number,
    data: {
      questionText?: string;
      questionType?: string;
      mark?: number;
      correctAnswerText?: string;
      explanation?: string;
      caseSensitive?: boolean;
      sampleAnswer?: string;
      options?: { optionText: string; isCorrect: boolean }[];
    }
  ): Promise<QuestionEntity> {
    const q = await this.questionRepository.findOne({
      where: { id },
      relations: { quiz: true, options: true }
    });
    if (!q) throw new NotFoundException('Question not found');

    if (data.questionText !== undefined) q.questionText = data.questionText;
    if (data.questionType !== undefined) q.questionType = data.questionType;
    if (data.mark !== undefined) q.mark = data.mark;
    if (data.correctAnswerText !== undefined) q.correctAnswerText = data.correctAnswerText || null;
    if (data.explanation !== undefined) q.explanation = data.explanation || null;
    if (data.caseSensitive !== undefined) q.caseSensitive = data.caseSensitive;
    if (data.sampleAnswer !== undefined) q.sampleAnswer = data.sampleAnswer || null;

    const savedQ = await this.questionRepository.save(q);

    if (data.options !== undefined) {
      if (q.options && q.options.length > 0) {
        await this.optionRepository.remove(q.options);
      }
      if (data.options.length > 0) {
        const newOpts = data.options.map(opt => this.optionRepository.create({
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          question: savedQ,
        }));
        await this.optionRepository.save(newOpts);
      }
    }

    await this.recalculateTotalMarks(q.quiz.id);
    return this.getQuestion(savedQ.id);
  }

  async deleteQuestion(id: number): Promise<void> {
    const q = await this.questionRepository.findOne({
      where: { id },
      relations: { quiz: true }
    });
    if (q) {
      const quizId = q.quiz.id;
      await this.questionRepository.remove(q);
      await this.recalculateTotalMarks(quizId);
    }
  }

  async updateAnswerKey(questionId: number, correctOptionId: number): Promise<void> {
    const question = await this.getQuestion(questionId);
    for (const opt of question.options) {
      opt.isCorrect = opt.id === correctOptionId;
      await this.optionRepository.save(opt);
    }
  }

  async reorderQuestions(quizId: number, questionIds: number[]): Promise<void> {
    for (let index = 0; index < questionIds.length; index++) {
      const qId = questionIds[index];
      await this.questionRepository.update({ id: qId, quiz: { id: quizId } }, { orderIndex: index });
    }
  }

  // Media attachments logger
  async logMediaAttachment(fileName: string, filePath: string, fileType: string): Promise<MediaAttachmentEntity> {
    const att = this.mediaRepository.create({ fileName, filePath, fileType });
    return this.mediaRepository.save(att);
  }

  // Access checkers
  getQuizAccessStatus(quiz: QuizEntity): 'not-started' | 'active' | 'closed' | 'stopped' {
    if (quiz.status === 'Force stopped') return 'stopped';
    if (quiz.status === 'Closed' || quiz.status === 'Archived') return 'closed';
    
    const now = new Date();
    if (now < quiz.startTime) return 'not-started';
    if (now > quiz.endTime) return 'closed';
    return 'active';
  }

  // Student specific clean details fetching
  async getQuizForStudent(quizId: number): Promise<any> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: { course: true, category: true, settings: true, questions: { options: true } },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz not found`);
    }

    const access = this.getQuizAccessStatus(quiz);
    if (access !== 'active') {
      return {
        id: quiz.id,
        quizTitle: quiz.quizTitle,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        duration: quiz.duration,
        passingMarks: quiz.passingMarks,
        status: quiz.status,
        accessStatus: access,
        message: access === 'not-started' ? 'Quiz has not started yet.' : 'Quiz is closed.',
        questions: [],
      };
    }

    const cleanQuestions = quiz.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      mark: q.mark,
      options: q.options.map(o => ({
        id: o.id,
        optionText: o.optionText,
      })),
    }));

    return {
      id: quiz.id,
      quizTitle: quiz.quizTitle,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      duration: quiz.duration,
      passingMarks: quiz.passingMarks,
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions,
      status: quiz.status,
      accessStatus: access,
      maxAttempts: quiz.settings?.maxAttempts ?? 1,
      showResultsImmediately: quiz.settings?.showResultsImmediately ?? true,
      questions: cleanQuestions,
    };
  }

  // Timed student submission with automated grading engine
  async submitQuiz(
    quizId: number,
    studentId: number,
    selectedAnswers: { questionId: number; selectedOptionId?: number; selectedOptionIds?: number[]; typedAnswerText?: string }[],
  ): Promise<QuizSubmissionEntity> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: { course: true, settings: true, questions: { options: true } },
    });

    if (!quiz) throw new NotFoundException(`Quiz not found`);

    const access = this.getQuizAccessStatus(quiz);
    const now = new Date();
    const graceTime = new Date(quiz.endTime.getTime() + 60000);
    
    if (quiz.status === 'Force stopped' || quiz.status === 'Closed' || quiz.status === 'Archived' || now > graceTime) {
      throw new BadRequestException('Quiz submission blocked: Time limit exceeded or quiz not active.');
    }

    const student = await this.studentRepository.findOneBy({ id: studentId });
    if (!student) throw new NotFoundException('Student account not found');

    // Handle multiple attempts restrictions using Settings maxAttempts limit
    const attemptsCount = await this.submissionRepository.count({
      where: { quiz: { id: quizId }, student: { id: studentId } },
    });
    const maxAttempts = quiz.settings?.maxAttempts ?? 1;
    if (attemptsCount >= maxAttempts) {
      throw new BadRequestException(`Submission blocked: You have reached the maximum allowed attempts (${maxAttempts}) for this quiz.`);
    }

    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let hasSubjective = false;

    const studentAnswersEntities: StudentAnswerEntity[] = [];

    for (const q of quiz.questions) {
      if (q.questionType === 'Subjective' || q.questionType === 'ESSAY') {
        hasSubjective = true;
      }

      const submissionAns = selectedAnswers.find(ans => ans.questionId === q.id);
      
      // Check if unanswered
      if (!submissionAns || 
          (q.questionType !== 'Subjective' && q.questionType !== 'ESSAY' && q.questionType !== 'FILL_BLANK' && q.questionType !== 'SHORT_ANSWER' && !submissionAns.selectedOptionId && (!submissionAns.selectedOptionIds || submissionAns.selectedOptionIds.length === 0)) ||
          ((q.questionType === 'FILL_BLANK' || q.questionType === 'SHORT_ANSWER' || q.questionType === 'FillBlank') && (!submissionAns.typedAnswerText || !submissionAns.typedAnswerText.trim())) ||
          ((q.questionType === 'Subjective' || q.questionType === 'ESSAY') && (!submissionAns.typedAnswerText || !submissionAns.typedAnswerText.trim()))
      ) {
        unansweredCount++;
        const blankSa = this.studentAnswerRepository.create({
          question: q,
          selectedOption: null,
          typedAnswerText: null,
          isCorrect: false,
          awardedMarks: 0,
        });
        studentAnswersEntities.push(blankSa);
        continue;
      }

      // Objective Single selection type MCQ & TF
      if (q.questionType === 'MCQ' || q.questionType === 'MCQ_SINGLE' || q.questionType === 'TF') {
        const opt = q.options.find(o => o.id === submissionAns.selectedOptionId);
        if (!opt) {
          unansweredCount++;
          continue;
        }

        const isCorrect = opt.isCorrect;
        let awardedMarks = 0;

        if (isCorrect) {
          correctCount++;
          awardedMarks = q.mark;
          totalScore += q.mark;
        } else {
          wrongCount++;
        }

        const sa = this.studentAnswerRepository.create({
          question: q,
          selectedOption: opt,
          isCorrect,
          awardedMarks,
        });
        studentAnswersEntities.push(sa);

      } else if (q.questionType === 'MCQ_MULTIPLE') {
        // Multiple Select MCQ Choice Checking
        const selectedIds = submissionAns.selectedOptionIds || (submissionAns.selectedOptionId ? [submissionAns.selectedOptionId] : []);
        const correctOpts = q.options.filter(o => o.isCorrect);
        const correctIds = correctOpts.map(o => o.id);
        
        // Exact match comparison
        const isCorrect = selectedIds.length === correctIds.length && 
                          selectedIds.every(id => correctIds.includes(id));
        let awardedMarks = 0;

        if (isCorrect) {
          correctCount++;
          awardedMarks = q.mark;
          totalScore += q.mark;
        } else {
          wrongCount++;
        }

        const firstSelected = q.options.find(o => o.id === selectedIds[0]) || null;
        const sa = this.studentAnswerRepository.create({
          question: q,
          selectedOption: firstSelected,
          typedAnswerText: JSON.stringify(selectedIds),
          isCorrect,
          awardedMarks,
        });
        studentAnswersEntities.push(sa);

      } else if (q.questionType === 'FILL_BLANK' || q.questionType === 'SHORT_ANSWER' || q.questionType === 'FillBlank') {
        // Blank key checks (case-sensitive or insensitive)
        const typed = (submissionAns.typedAnswerText || '').trim();
        const correctText = q.correctAnswerText || '';
        let isCorrect = false;
        let accepted: string[] = [];
        
        try {
          accepted = JSON.parse(correctText);
          if (!Array.isArray(accepted)) accepted = [correctText];
        } catch (e) {
          accepted = correctText.split('|');
        }

        isCorrect = accepted.some(ans => {
          const val1 = q.caseSensitive ? typed : typed.toLowerCase();
          const val2 = q.caseSensitive ? ans.trim() : ans.trim().toLowerCase();
          return val1 === val2;
        });

        let awardedMarks = 0;

        if (isCorrect) {
          correctCount++;
          awardedMarks = q.mark;
          totalScore += q.mark;
        } else {
          wrongCount++;
        }

        const sa = this.studentAnswerRepository.create({
          question: q,
          selectedOption: null,
          typedAnswerText: typed,
          isCorrect,
          awardedMarks,
        });
        studentAnswersEntities.push(sa);

      } else if (q.questionType === 'Subjective' || q.questionType === 'ESSAY') {
        const sa = this.studentAnswerRepository.create({
          question: q,
          selectedOption: null,
          typedAnswerText: submissionAns.typedAnswerText,
          isCorrect: false,
          awardedMarks: null, // Pending evaluation
        });
        studentAnswersEntities.push(sa);
      }
    }

    let status = 'Pending Evaluation';
    if (!hasSubjective) {
      status = totalScore >= quiz.passingMarks ? 'Pass' : 'Fail';
    }

    const percentage = (totalScore / (quiz.totalMarks || 100)) * 100;

    const submission = this.submissionRepository.create({
      studentName: student.name,
      collegeName: student.collegeName,
      courseId: quiz.course.courseId,
      courseName: quiz.course.courseName,
      score: totalScore,
      totalMarks: quiz.totalMarks,
      percentage: Math.max(0, percentage),
      correctCount,
      wrongCount,
      unansweredCount,
      status,
      quiz,
      student,
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    for (const sa of studentAnswersEntities) {
      sa.submission = savedSubmission;
      await this.studentAnswerRepository.save(sa);
    }

    return savedSubmission;
  }

  async evaluateSubmission(
    submissionId: number,
    evaluations: { questionId: number; marks: number }[],
  ): Promise<QuizSubmissionEntity> {
    const sub = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: { quiz: { settings: true }, studentAnswers: { question: true } },
    });

    if (!sub) throw new NotFoundException('Submission not found');

    for (const grading of evaluations) {
      const sa = sub.studentAnswers.find(answer => answer.question.id === grading.questionId);
      if (!sa) continue;

      sa.awardedMarks = grading.marks;
      sa.isCorrect = grading.marks > 0;
      await this.studentAnswerRepository.save(sa);
    }

    let newScore = 0;
    let pendingCount = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    for (const sa of sub.studentAnswers) {
      if (sa.awardedMarks === null) {
        pendingCount++;
      } else {
        newScore += sa.awardedMarks;
        if (sa.awardedMarks > 0) {
          correctCount++;
        } else if (sa.awardedMarks < 0 || (sa.awardedMarks === 0 && sa.selectedOption !== null)) {
          wrongCount++;
        } else {
          unansweredCount++;
        }
      }
    }

    sub.score = newScore;
    sub.percentage = Math.max(0, (newScore / (sub.totalMarks || 100)) * 100);
    sub.correctCount = correctCount;
    sub.wrongCount = wrongCount;
    sub.unansweredCount = unansweredCount;

    if (pendingCount === 0) {
      const passingPercentage = sub.quiz.settings?.passingPercentage ?? 40;
      const pass = (sub.totalMarks > 0 && passingPercentage > 0) ? (sub.percentage >= passingPercentage) : (newScore >= sub.quiz.passingMarks);
      sub.status = pass ? 'Pass' : 'Fail';
    } else {
      sub.status = 'Pending Evaluation';
    }

    return this.submissionRepository.save(sub);
  }

  async getSubmissions(): Promise<QuizSubmissionEntity[]> {
    return this.submissionRepository.find({
      relations: { quiz: { course: true } },
      order: { submittedAt: 'DESC' },
    });
  }

  async getSubmissionDetail(id: number): Promise<any> {
    const sub = await this.submissionRepository.findOne({
      where: { id },
      relations: {
        quiz: true,
        studentAnswers: {
          question: { options: true },
          selectedOption: true,
        },
      },
    });
    if (!sub) throw new NotFoundException(`Submission not found`);
    return sub;
  }

  async getLeaderboard(quizId: number): Promise<QuizSubmissionEntity[]> {
    return this.submissionRepository.find({
      where: { quiz: { id: quizId } },
      relations: { student: true },
      order: { score: 'DESC', submittedAt: 'ASC' },
    });
  }

  async getAnalytics(quizId: number): Promise<any> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: { questions: { studentAnswers: true } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const submissions = await this.submissionRepository.find({
      where: { quiz: { id: quizId } },
    });

    const count = submissions.length;
    if (count === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passPercentage: 0,
        failPercentage: 0,
        questionAnalysis: [],
      };
    }

    const sumScore = submissions.reduce((sum, s) => sum + s.score, 0);
    const passCount = submissions.filter(s => s.status === 'Pass').length;
    const failCount = submissions.filter(s => s.status === 'Fail').length;

    const questionAnalysis = quiz.questions.map(q => {
      const answers = q.studentAnswers || [];
      const totalAnswers = answers.length;
      const correct = answers.filter(a => a.isCorrect).length;
      const wrong = answers.filter(a => a.awardedMarks !== null && a.awardedMarks < 0).length;
      const blank = totalAnswers - (correct + wrong);

      return {
        questionId: q.id,
        questionText: q.questionText,
        correctRatio: totalAnswers > 0 ? (correct / totalAnswers) * 100 : 0,
        wrongRatio: totalAnswers > 0 ? (wrong / totalAnswers) * 100 : 0,
        blankRatio: totalAnswers > 0 ? (blank / totalAnswers) * 100 : 0,
      };
    });

    return {
      totalAttempts: count,
      averageScore: Number((sumScore / count).toFixed(2)),
      passPercentage: Number(((passCount / count) * 100).toFixed(1)),
      failPercentage: Number(((failCount / count) * 100).toFixed(1)),
      questionAnalysis,
    };
  }

  async generateCSVReport(): Promise<string> {
    const submissions = await this.getSubmissions();
    let csv = 'Student Name,College Name,Course ID,Course Name,Quiz Title,Score,Total Marks,Percentage,Status,Submitted At\n';
    submissions.forEach(s => {
      csv += `"${s.studentName}","${s.collegeName}","${s.courseId}","${s.courseName}","${s.quiz?.quizTitle}",${s.score},${s.totalMarks},${s.percentage.toFixed(1)},"${s.status}","${s.submittedAt.toISOString()}"\n`;
    });
    return csv;
  }
}
