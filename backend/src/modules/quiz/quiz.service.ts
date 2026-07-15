import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuizEntity, QuizDocument } from '../../entities/quiz.entity';
import { QuizSubmissionEntity, QuizSubmissionDocument } from '../../entities/quiz-submission.entity';
import { CourseEntity, CourseDocument } from '../../entities/course.entity';
import { StudentEntity, StudentDocument } from '../../entities/student.entity';
import { CategoryEntity, CategoryDocument } from '../../entities/category.entity';
import { MediaAttachmentEntity, MediaAttachmentDocument } from '../../entities/media-attachment.entity';
import { QuestionEntity } from '../../entities/question.entity';

@Injectable()
export class QuizService implements OnModuleInit {
  constructor(
    @InjectModel(QuizEntity.name)
    private quizModel: Model<QuizDocument>,
    @InjectModel(QuizSubmissionEntity.name)
    private submissionModel: Model<QuizSubmissionDocument>,
    @InjectModel(CourseEntity.name)
    private courseModel: Model<CourseDocument>,
    @InjectModel(StudentEntity.name)
    private studentModel: Model<StudentDocument>,
    @InjectModel(CategoryEntity.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(MediaAttachmentEntity.name)
    private mediaModel: Model<MediaAttachmentDocument>,
  ) {}

  async onModuleInit() {
    // Seed standard quiz categories if the database categories collection is empty
    const count = await this.categoryModel.countDocuments();
    if (count === 0) {
      const categories = [
        { name: 'Programming', description: 'Coding, scripts, and software engineering questions' },
        { name: 'Mathematics', description: 'Algebra, Geometry, Calculus, and logic formulas' },
        { name: 'General Science', description: 'Physics, Chemistry, and Biology assessment tasks' },
        { name: 'General', description: 'General Knowledge and general education trivia' },
        { name: 'Subjective Essay', description: 'Essay-based long form assessment tasks' },
      ];
      await this.categoryModel.insertMany(categories);
      console.log('Quiz categories successfully seeded in MongoDB!');
    }
  }

  // Categories operations
  async getCategories(): Promise<CategoryEntity[]> {
    return this.categoryModel.find().sort({ name: 1 }).exec();
  }

  async createCategory(name: string, description?: string): Promise<CategoryEntity> {
    const existing = await this.categoryModel.findOne({ name }).exec();
    if (existing) return existing;
    const cat = new this.categoryModel({ name, description });
    return cat.save();
  }

  // Quiz CRUD & configurations
  async createQuiz(
    courseId: string,
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
    categoryId?: string,
    settingsData?: { maxAttempts?: number; passingPercentage?: number; showResultsImmediately?: boolean }
  ): Promise<any> {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) {
      throw new NotFoundException(`Course not found`);
    }

    let category = null;
    if (categoryId) {
      category = await this.categoryModel.findById(categoryId).exec();
    }

    const quiz = new this.quizModel({
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
      course: courseId,
      category: categoryId || null,
      settings: {
        maxAttempts: settingsData?.maxAttempts ?? 1,
        passingPercentage: settingsData?.passingPercentage ?? 40,
        showResultsImmediately: settingsData?.showResultsImmediately ?? true,
      },
      questions: [],
    });

    return quiz.save();
  }

  async getQuizzesByCourse(courseId: string): Promise<any[]> {
    return this.quizModel.find({ course: courseId })
      .populate('category')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getQuiz(id: string): Promise<any> {
    const quiz = await this.quizModel.findById(id)
      .populate('course')
      .populate('category')
      .exec();
    if (!quiz) {
      throw new NotFoundException(`Quiz not found`);
    }
    return quiz;
  }

  async updateTiming(
    id: string,
    startTime?: Date,
    endTime?: Date,
    status?: string,
    resultsPublished?: boolean,
  ): Promise<any> {
    const quiz = await this.getQuiz(id);
    if (startTime) quiz.startTime = startTime;
    if (endTime) quiz.endTime = endTime;
    if (status) quiz.status = status;
    if (resultsPublished !== undefined) quiz.resultsPublished = resultsPublished;
    return quiz.save();
  }

  // Unified quiz settings update
  async updateQuiz(
    id: string,
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
      categoryId?: string;
      settings?: {
        maxAttempts?: number;
        passingPercentage?: number;
        showResultsImmediately?: boolean;
      };
      questions?: any[];
    }
  ): Promise<any> {
    const quiz = await this.quizModel.findById(id).exec();
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
      quiz.category = data.categoryId || null;
    }

    if (data.settings) {
      if (!quiz.settings) {
        quiz.settings = {} as any;
      }
      if (data.settings.maxAttempts !== undefined) quiz.settings.maxAttempts = data.settings.maxAttempts;
      if (data.settings.passingPercentage !== undefined) quiz.settings.passingPercentage = data.settings.passingPercentage;
      if (data.settings.showResultsImmediately !== undefined) quiz.settings.showResultsImmediately = data.settings.showResultsImmediately;
    }

    if (data.questions !== undefined) {
      quiz.questions = data.questions.map((nq, idx) => {
        const questionId = nq._id || nq.id || new Types.ObjectId();
        const options = (nq.options || []).map((o: any) => ({
          _id: o._id || o.id || new Types.ObjectId(),
          optionText: o.optionText,
          isCorrect: o.isCorrect || false,
        }));
        return {
          _id: questionId.toString(),
          questionText: nq.questionText,
          questionType: nq.questionType,
          mark: nq.mark || 1,
          correctAnswerText: nq.correctAnswerText || null,
          orderIndex: idx,
          explanation: nq.explanation || null,
          caseSensitive: nq.caseSensitive || false,
          sampleAnswer: nq.sampleAnswer || null,
          options,
        };
      }) as any;
    }

    // Automatically calculate and sync totalMarks
    quiz.totalMarks = quiz.questions.reduce((sum, q) => sum + (q.mark || 0), 0);

    return quiz.save();
  }

  async recalculateTotalMarks(quizId: string): Promise<number> {
    const quiz = await this.quizModel.findById(quizId).exec();
    if (!quiz) throw new NotFoundException('Quiz not found');
    const total = quiz.questions.reduce((sum, q) => sum + (q.mark || 0), 0);
    quiz.totalMarks = total;
    await quiz.save();
    return total;
  }

  async deleteQuiz(id: string): Promise<void> {
    await this.quizModel.findByIdAndDelete(id).exec();
  }

  // Quiz duplication logic
  async duplicateQuiz(id: string): Promise<any> {
    const orig = await this.getQuiz(id);
    if (!orig) throw new NotFoundException('Quiz to duplicate not found');

    const duplicatedQuiz = new this.quizModel({
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
      settings: orig.settings,
      questions: orig.questions.map((q: any) => {
        const qId = new Types.ObjectId();
        return {
          _id: qId.toString(),
          questionText: q.questionText,
          questionType: q.questionType,
          mark: q.mark,
          correctAnswerText: q.correctAnswerText,
          orderIndex: q.orderIndex,
          explanation: q.explanation,
          caseSensitive: q.caseSensitive,
          sampleAnswer: q.sampleAnswer,
          options: q.options.map((opt: any) => ({
            _id: new Types.ObjectId().toString(),
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          })),
        };
      }),
    });

    return duplicatedQuiz.save();
  }

  // Question & Option CRUD & updates
  async addQuestion(
    quizId: string,
    questionText: string,
    questionType: string,
    mark: number,
    correctAnswerText?: string,
    optionsData?: { optionText: string; isCorrect: boolean }[],
  ): Promise<any> {
    const quiz = await this.quizModel.findById(quizId).exec();
    if (!quiz) throw new NotFoundException(`Quiz not found`);

    const questionId = new Types.ObjectId();
    const options = (optionsData || []).map(o => ({
      _id: new Types.ObjectId().toString(),
      optionText: o.optionText,
      isCorrect: o.isCorrect || false,
    }));

    const newQuestion = {
      _id: questionId.toString(),
      questionText,
      questionType,
      mark,
      correctAnswerText: correctAnswerText || null,
      orderIndex: quiz.questions.length,
      options,
    };

    quiz.questions.push(newQuestion as any);
    quiz.totalMarks = quiz.questions.reduce((sum, q) => sum + (q.mark || 0), 0);
    await quiz.save();

    return newQuestion;
  }

  async getQuestion(id: string): Promise<any> {
    const quiz = await this.quizModel.findOne({ 'questions._id': id }).exec();
    if (!quiz) throw new NotFoundException(`Question not found`);
    const question = quiz.questions.find(q => q._id.toString() === id.toString());
    if (!question) throw new NotFoundException(`Question not found`);
    return question;
  }

  async updateQuestion(
    id: string,
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
  ): Promise<any> {
    const quiz = await this.quizModel.findOne({ 'questions._id': id }).exec();
    if (!quiz) throw new NotFoundException('Question not found');
    const q = quiz.questions.find(q => q._id.toString() === id.toString());
    if (!q) throw new NotFoundException('Question not found');

    if (data.questionText !== undefined) q.questionText = data.questionText;
    if (data.questionType !== undefined) q.questionType = data.questionType;
    if (data.mark !== undefined) q.mark = data.mark;
    if (data.correctAnswerText !== undefined) q.correctAnswerText = data.correctAnswerText || null;
    if (data.explanation !== undefined) q.explanation = data.explanation || null;
    if (data.caseSensitive !== undefined) q.caseSensitive = data.caseSensitive;
    if (data.sampleAnswer !== undefined) q.sampleAnswer = data.sampleAnswer || null;

    if (data.options !== undefined) {
      q.options = data.options.map(opt => ({
        _id: new Types.ObjectId().toString(),
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
      })) as any;
    }

    quiz.totalMarks = quiz.questions.reduce((sum, q) => sum + (q.mark || 0), 0);
    await quiz.save();
    return q;
  }

  async deleteQuestion(id: string): Promise<void> {
    const quiz = await this.quizModel.findOne({ 'questions._id': id }).exec();
    if (quiz) {
      quiz.questions = quiz.questions.filter(q => q._id.toString() !== id.toString());
      quiz.questions.forEach((q, idx) => { q.orderIndex = idx; });
      quiz.totalMarks = quiz.questions.reduce((sum, q) => sum + (q.mark || 0), 0);
      await quiz.save();
    }
  }

  async updateAnswerKey(questionId: string, correctOptionId: string): Promise<void> {
    const quiz = await this.quizModel.findOne({ 'questions._id': questionId }).exec();
    if (!quiz) throw new NotFoundException('Question not found');
    const q = quiz.questions.find(q => q._id.toString() === questionId.toString());
    if (!q) throw new NotFoundException('Question not found');
    
    q.options.forEach(opt => {
      opt.isCorrect = opt._id.toString() === correctOptionId.toString();
    });
    await quiz.save();
  }

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<void> {
    const quiz = await this.quizModel.findById(quizId).exec();
    if (!quiz) throw new NotFoundException('Quiz not found');

    const newQs: any[] = [];
    for (const qId of questionIds) {
      const found = quiz.questions.find(q => q._id.toString() === qId.toString());
      if (found) newQs.push(found);
    }

    quiz.questions.forEach(q => {
      if (!newQs.some(nq => nq._id.toString() === q._id.toString())) {
        newQs.push(q);
      }
    });

    newQs.forEach((q, index) => {
      q.orderIndex = index;
    });

    quiz.questions = newQs;
    await quiz.save();
  }

  // Media attachments logger
  async logMediaAttachment(fileName: string, filePath: string, fileType: string): Promise<MediaAttachmentEntity> {
    const att = new this.mediaModel({ fileName, filePath, fileType });
    return att.save();
  }

  // Access checkers
  getQuizAccessStatus(quiz: any): 'not-started' | 'active' | 'closed' | 'stopped' {
    if (quiz.status === 'Force stopped') return 'stopped';
    if (quiz.status === 'Closed' || quiz.status === 'Archived') return 'closed';
    
    const now = new Date();
    if (now < quiz.startTime) return 'not-started';
    if (now > quiz.endTime) return 'closed';
    return 'active';
  }

  // Student specific clean details fetching
  async getQuizForStudent(quizId: string): Promise<any> {
    const quiz = await this.quizModel.findById(quizId)
      .populate('course')
      .populate('category')
      .exec();

    if (!quiz) {
      throw new NotFoundException(`Quiz not found`);
    }

    const access = this.getQuizAccessStatus(quiz);
    if (access !== 'active') {
      return {
        id: quiz._id,
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
      id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      mark: q.mark,
      options: q.options.map(o => ({
        id: o._id,
        optionText: o.optionText,
      })),
    }));

    return {
      id: quiz._id,
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
    quizId: string,
    studentId: string,
    selectedAnswers: { questionId: string; selectedOptionId?: string; selectedOptionIds?: string[]; typedAnswerText?: string }[],
    timeTakenSeconds: number = 0,
  ): Promise<any> {
    const quiz = await this.quizModel.findById(quizId).populate('course').exec();
    if (!quiz) throw new NotFoundException(`Quiz not found`);

    const access = this.getQuizAccessStatus(quiz);
    const now = new Date();
    const graceTime = new Date(quiz.endTime.getTime() + 60000);
    
    if (quiz.status === 'Force stopped' || quiz.status === 'Closed' || quiz.status === 'Archived' || now > graceTime) {
      throw new BadRequestException('Quiz submission blocked: Time limit exceeded or quiz not active.');
    }

    const student = await this.studentModel.findById(studentId).exec();
    if (!student) throw new NotFoundException('Student account not found');

    // Handle multiple attempts restrictions using Settings maxAttempts limit
    const attemptsCount = await this.submissionModel.countDocuments({
      quiz: quizId,
      student: studentId,
    });
    const maxAttempts = quiz.settings?.maxAttempts ?? 1;
    if (attemptsCount >= maxAttempts) {
      throw new BadRequestException(`Submission blocked: You have reached the maximum allowed attempts (${maxAttempts}) for this quiz.`);
    }

    let rawScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let hasSubjective = false;

    const studentAnswersEntities: any[] = [];

    for (const q of quiz.questions) {
      if (q.questionType === 'Subjective' || q.questionType === 'ESSAY') {
        hasSubjective = true;
      }

      const submissionAns = selectedAnswers.find(ans => ans.questionId.toString() === q._id.toString());
      
      // Check if unanswered
      if (!submissionAns || 
          (q.questionType !== 'Subjective' && q.questionType !== 'ESSAY' && q.questionType !== 'FILL_BLANK' && q.questionType !== 'SHORT_ANSWER' && !submissionAns.selectedOptionId && (!submissionAns.selectedOptionIds || submissionAns.selectedOptionIds.length === 0)) ||
          ((q.questionType === 'FILL_BLANK' || q.questionType === 'SHORT_ANSWER' || q.questionType === 'FillBlank') && (!submissionAns.typedAnswerText || !submissionAns.typedAnswerText.trim())) ||
          ((q.questionType === 'Subjective' || q.questionType === 'ESSAY') && (!submissionAns.typedAnswerText || !submissionAns.typedAnswerText.trim()))
      ) {
        unansweredCount++;
        const blankSa = {
          question: q,
          selectedOption: null,
          typedAnswerText: null,
          isCorrect: false,
          awardedMarks: 0,
        };
        studentAnswersEntities.push(blankSa);
        continue;
      }

      // Objective Single selection type MCQ & TF
      if (q.questionType === 'MCQ' || q.questionType === 'MCQ_SINGLE' || q.questionType === 'TF') {
        const opt = q.options.find(o => o._id.toString() === submissionAns.selectedOptionId?.toString());
        if (!opt) {
          unansweredCount++;
          continue;
        }

        const isCorrect = opt.isCorrect;
        let awardedMarks = 0;

        if (isCorrect) {
          correctCount++;
          awardedMarks = q.mark;
          rawScore += q.mark;
        } else {
          wrongCount++;
          if (quiz.negativeMarkingEnabled) {
            awardedMarks = -Math.abs(quiz.negativeMarkingValue || 0);
            rawScore -= Math.abs(quiz.negativeMarkingValue || 0);
          }
        }

        const sa = {
          question: q,
          selectedOption: opt,
          isCorrect,
          awardedMarks,
        };
        studentAnswersEntities.push(sa);

      } else if (q.questionType === 'MCQ_MULTIPLE') {
        // Multiple Select MCQ Choice Checking
        const selectedIds = submissionAns.selectedOptionIds || (submissionAns.selectedOptionId ? [submissionAns.selectedOptionId] : []);
        const correctOpts = q.options.filter(o => o.isCorrect);
        const correctIds = correctOpts.map(o => o._id.toString());
        
        // Exact match comparison
        const isCorrect = selectedIds.length === correctIds.length && 
                          selectedIds.every(id => correctIds.includes(id.toString()));
        let awardedMarks = 0;

        if (isCorrect) {
          correctCount++;
          awardedMarks = q.mark;
          rawScore += q.mark;
        } else {
          wrongCount++;
          if (quiz.negativeMarkingEnabled) {
            awardedMarks = -Math.abs(quiz.negativeMarkingValue || 0);
            rawScore -= Math.abs(quiz.negativeMarkingValue || 0);
          }
        }

        const firstSelected = q.options.find(o => o._id.toString() === selectedIds[0]?.toString()) || null;
        const sa = {
          question: q,
          selectedOption: firstSelected,
          typedAnswerText: JSON.stringify(selectedIds),
          isCorrect,
          awardedMarks,
        };
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
          rawScore += q.mark;
        } else {
          wrongCount++;
          if (quiz.negativeMarkingEnabled) {
            awardedMarks = -Math.abs(quiz.negativeMarkingValue || 0);
            rawScore -= Math.abs(quiz.negativeMarkingValue || 0);
          }
        }

        const sa = {
          question: q,
          selectedOption: null,
          typedAnswerText: typed,
          isCorrect,
          awardedMarks,
        };
        studentAnswersEntities.push(sa);

      } else if (q.questionType === 'Subjective' || q.questionType === 'ESSAY') {
        const sa = {
          question: q,
          selectedOption: null,
          typedAnswerText: submissionAns.typedAnswerText || '',
          isCorrect: false,
          awardedMarks: null, // Pending evaluation
        };
        studentAnswersEntities.push(sa);
      }
    }

    let status = 'Pending Evaluation';
    if (!hasSubjective) {
      status = rawScore >= quiz.passingMarks ? 'Pass' : 'Fail';
    }

    const percentage = (rawScore / (quiz.totalMarks || 100)) * 100;
    
    // Evaluate Grade
    let grade = '';
    if (!hasSubjective) {
      if (percentage >= 80) grade = 'Excellent';
      else if (percentage >= 60) grade = 'Passed';
      else if (percentage >= 40) grade = 'Average';
      else grade = 'Failed';
    }

    const submission = new this.submissionModel({
      studentName: student.name,
      collegeName: student.collegeName,
      courseId: (quiz.course as any).courseId,
      courseName: (quiz.course as any).courseName,
      score: rawScore,
      totalMarks: quiz.totalMarks,
      percentage: Math.max(0, percentage),
      correctCount,
      wrongCount,
      unansweredCount,
      status,
      timeTakenSeconds,
      grade,
      quiz: quizId,
      student: studentId,
      studentAnswers: studentAnswersEntities,
    });

    return submission.save();
  }

  async evaluateSubmission(
    submissionId: string,
    evaluations: { questionId: string; marks: number }[],
  ): Promise<any> {
    const sub = await this.submissionModel.findById(submissionId).populate('quiz').exec();
    if (!sub) throw new NotFoundException('Submission not found');

    for (const grading of evaluations) {
      const sa = sub.studentAnswers.find(answer => answer.question._id.toString() === grading.questionId.toString());
      if (!sa) continue;

      sa.awardedMarks = grading.marks;
      sa.isCorrect = grading.marks > 0;
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
      const passingPercentage = (sub.quiz as any).settings?.passingPercentage ?? 40;
      const pass = (sub.totalMarks > 0 && passingPercentage > 0) ? (sub.percentage >= passingPercentage) : (newScore >= (sub.quiz as any).passingMarks);
      sub.status = pass ? 'Pass' : 'Fail';
      
      if (sub.percentage >= 80) sub.grade = 'Excellent';
      else if (sub.percentage >= 60) sub.grade = 'Passed';
      else if (sub.percentage >= 40) sub.grade = 'Average';
      else sub.grade = 'Failed';
    } else {
      sub.status = 'Pending Evaluation';
      sub.grade = '';
    }

    return sub.save();
  }

  async getSubmissions(): Promise<any[]> {
    return this.submissionModel.find()
      .populate({ path: 'quiz', populate: { path: 'course' } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSubmissionDetail(id: string): Promise<any> {
    const sub = await this.submissionModel.findById(id).populate('quiz').exec();
    if (!sub) throw new NotFoundException(`Submission not found`);
    return sub;
  }

  async getStudentSubmissionResult(id: string, studentId: string): Promise<any> {
    const sub = await this.submissionModel.findOne({ _id: new Types.ObjectId(id) as any, student: new Types.ObjectId(studentId) as any }).populate('quiz').exec();
    if (!sub) throw new NotFoundException(`Submission not found for this student`);

    const showAnswers = (sub.quiz as any).resultsPublished || ((sub.quiz as any).settings?.showResultsImmediately && sub.status !== 'Pending Evaluation');

    return {
      id: sub._id,
      studentName: sub.studentName,
      courseId: sub.courseId,
      courseName: sub.courseName,
      score: sub.score,
      totalMarks: sub.totalMarks,
      percentage: sub.percentage,
      correctCount: sub.correctCount,
      wrongCount: sub.wrongCount,
      unansweredCount: sub.unansweredCount,
      status: sub.status,
      timeTakenSeconds: sub.timeTakenSeconds,
      grade: sub.grade,
      submittedAt: sub.submittedAt,
      quiz: {
        id: (sub.quiz as any)._id,
        quizTitle: (sub.quiz as any).quizTitle,
        resultsPublished: (sub.quiz as any).resultsPublished,
        difficulty: (sub.quiz as any).difficulty,
        showResultsImmediately: (sub.quiz as any).settings?.showResultsImmediately,
      },
      studentAnswers: showAnswers ? sub.studentAnswers.map(sa => ({
        id: sa._id,
        isCorrect: sa.isCorrect,
        typedAnswerText: sa.typedAnswerText,
        awardedMarks: sa.awardedMarks,
        selectedOption: sa.selectedOption ? {
          id: sa.selectedOption._id,
          optionText: sa.selectedOption.optionText,
          isCorrect: sa.selectedOption.isCorrect,
        } : null,
        question: {
          id: sa.question._id,
          questionText: sa.question.questionText,
          questionType: sa.question.questionType,
          mark: sa.question.mark,
          explanation: sa.question.explanation,
          correctAnswerText: sa.question.correctAnswerText,
          options: sa.question.options.map(o => ({
            id: o._id,
            optionText: o.optionText,
            isCorrect: o.isCorrect
          }))
        }
      })) : []
    };
  }

  async getAttemptStats(quizId: string, studentId: string): Promise<any> {
    const submissions = await this.submissionModel.find({
      quiz: quizId,
      student: studentId,
    }).sort({ submittedAt: 1 }).exec();

    const totalAttempts = submissions.length;
    if (totalAttempts === 0) {
      return {
        totalAttempts: 0,
        bestScore: 0,
        latestScore: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        scoreHistory: []
      };
    }

    const scores = submissions.map(s => s.score);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageScore = Number((scores.reduce((sum, s) => sum + s, 0) / totalAttempts).toFixed(2));
    const latestScore = submissions[totalAttempts - 1].score;
    const bestScore = highestScore;

    return {
      totalAttempts,
      bestScore,
      latestScore,
      averageScore,
      highestScore,
      lowestScore,
      scoreHistory: submissions.map((s, index) => ({
        attemptNumber: index + 1,
        score: s.score,
        percentage: s.percentage,
        submittedAt: s.submittedAt,
        grade: s.grade
      }))
    };
  }

  async getLeaderboard(quizId: string): Promise<any[]> {
    return this.submissionModel.find({ quiz: quizId })
      .populate('student')
      .sort({ score: -1, submittedAt: 1 })
      .exec();
  }

  async getAnalytics(quizId: string): Promise<any> {
    const quiz = await this.quizModel.findById(quizId).exec();
    if (!quiz) throw new NotFoundException('Quiz not found');

    const submissions = await this.submissionModel.find({ quiz: quizId }).exec();

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
      const answers: any[] = [];
      submissions.forEach(sub => {
        const ans = sub.studentAnswers.find(sa => sa.question._id.toString() === q._id.toString());
        if (ans) answers.push(ans);
      });

      const totalAnswers = answers.length;
      const correct = answers.filter(a => a.isCorrect).length;
      const wrong = answers.filter(a => a.awardedMarks !== null && a.awardedMarks < 0).length;
      const blank = totalAnswers - (correct + wrong);

      return {
        questionId: q._id,
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
      csv += `"${s.studentName}","${s.collegeName}","${s.courseId}","${s.courseName}","${(s.quiz as any)?.quizTitle}",${s.score},${s.totalMarks},${s.percentage.toFixed(1)},"${s.status}","${s.submittedAt.toISOString()}"\n`;
    });
    return csv;
  }
}
