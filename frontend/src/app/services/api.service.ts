import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';

export interface Course {
  id: string;
  courseId: string; // display ID like 'devops'
  courseName: string;
  duration?: string;
  status: string;
}

export interface Option {
  id: string;
  optionText: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: string; // 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'TF' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'ESSAY'
  mark: number;
  correctAnswerText?: string;
  options: Option[];
  orderIndex?: number;
  explanation?: string;
  caseSensitive?: boolean;
  sampleAnswer?: string;
}

export interface Quiz {
  id: string;
  quizTitle: string;
  startTime: string;
  endTime: string;
  status: string; // 'Draft' | 'Published' | 'Archived'
  totalMarks: number;
  duration: number; // in minutes
  passingMarks: number;
  timerMode: string; // 'No Timer' | 'Quiz Timer' | 'Question Timer'
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  autoSubmit: boolean;
  showResult: boolean;
  resultsPublished?: boolean;
  negativeMarkingEnabled?: boolean;
  negativeMarkingValue?: number;
  courseId?: string;
  instructions?: string;
  course?: Course;
  questions?: any[];
  description?: string;
  difficulty?: string; // 'Easy' | 'Medium' | 'Hard'
  category?: { id: string; name: string } | null;
  publishAt?: string;
  expireAt?: string;
  createdAt?: string;
}

export interface StudentAnswer {
  id: string;
  isCorrect?: boolean;
  typedAnswerText?: string | null;
  typedAnswer?: string | null;
  essayAnswer?: string | null;
  awardedMarks: number | null;
  question: Question;
  selectedOption?: Option | null;
  selectedOptions?: string[];
  selectedOptionId?: string | null;
}

export interface QuizSubmission {
  id: string;
  studentName: string;
  collegeName: string;
  courseId: string;
  courseName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  attemptedCount?: number;
  totalQuestions?: number;
  status: string;
  passed?: boolean;
  submittedAt: string;
  createdAt?: string;
  startedAt?: string;
  timeTakenSeconds?: number;
  grade?: string;
  quiz?: Quiz;
  studentId?: string;
  student?: any;
  studentAnswers?: StudentAnswer[];
  answers?: any[];
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  expectedOutcome?: string;
  rubric?: any;
  maxMarks?: number;
  deadline: string;
  course?: Course;
}

export interface AssignmentAiEvaluation {
  id: string;
  submissionId: string;
  version: number;
  aiModel: string;
  promptVersion: string;
  status: string; // 'COMPLETED' | 'REVIEW_REQUIRED' | 'FAILED'
  completionStatus?: string; // 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'NOT_COMPLETED'
  completionPercentage?: number;
  recommendedMarks?: number;
  confidenceScore?: number;
  requirementsChecklist?: Array<{ requirement: string; satisfied: boolean; explanation: string }>;
  missingRequirements?: string[];
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  rawAiOutput?: string;
  errorMessage?: string;
  evaluatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  studentName: string;
  collegeName: string;
  courseName?: string;
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  extractedText?: string;
  fileType?: string;
  currentStatus?: string; // 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'REVIEW_REQUIRED' | 'FAILED' | 'PUBLISHED'
  submittedAt: string;
  createdAt?: string;
  marks: number | null;
  feedback: string | null;
  publishedAt?: string | null;
  course?: Course;
  assignment?: Assignment | null;
  evaluations?: AssignmentAiEvaluation[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  get backendRootUrl(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('edinz_api_base_url');
      if (stored) return stored.replace(/\/api\/?$/, '');
      if (window.location.hostname.includes('vercel.app')) {
        return window.location.origin;
      }
      if (window.location.hostname.includes('onrender.com') || window.location.hostname.includes('netlify.app')) {
        return 'https://edinz-quiz-backend.onrender.com';
      }
    }
    return 'http://localhost:3000';
  }

  private get baseUrl(): string {
    return `${this.backendRootUrl}/api`;
  }
  private coursesCache$: Observable<Course[]> | null = null;
  private categoriesCache$: Observable<any[]> | null = null;

  constructor(private http: HttpClient) {
    this.pingWarmupBackend();
  }

  private pingWarmupBackend(): void {
    if (typeof window !== 'undefined') {
      this.http.get(`${this.baseUrl}/courses`).subscribe({ error: () => {} });
    }
  }

  private clearCoursesCache() {
    this.coursesCache$ = null;
  }

  private clearCategoriesCache() {
    this.categoriesCache$ = null;
  }

  private getHeaders() {
    let headersConfig: { [header: string]: string } = {};
    if (typeof window !== 'undefined') {
      const studentToken = localStorage.getItem('edinz_student_token');
      const adminToken = localStorage.getItem('edinz_admin_token');
      const isAdminContext = window.location.pathname.includes('/admin');
      const token = isAdminContext ? (adminToken || studentToken) : (studentToken || adminToken);
      if (token) {
        headersConfig['Authorization'] = `Bearer ${token}`;
      }
    }
    return { headers: new HttpHeaders(headersConfig) };
  }

  // Student auth endpoints
  registerStudent(email: string, pass: string, name: string, collegeName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/student/register`, { email, password: pass, name, collegeName });
  }

  loginStudent(email: string, pass: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/student/login`, { email, password: pass });
  }

  // Admin auth endpoints
  loginAdmin(email: string, pass: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, { email, password: pass });
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auth/profile`, this.getHeaders());
  }

  // Courses API (with shareReplay caching)
  getCourses(): Observable<Course[]> {
    if (!this.coursesCache$) {
      this.coursesCache$ = this.http.get<Course[]>(`${this.baseUrl}/courses`, this.getHeaders()).pipe(
        shareReplay(1)
      );
    }
    return this.coursesCache$;
  }

  createCourse(courseId: string, courseName: string, duration?: string, status: string = 'Active'): Observable<Course> {
    return this.http.post<Course>(`${this.baseUrl}/courses`, { courseId, courseName, duration, status }, this.getHeaders()).pipe(
      tap(() => this.clearCoursesCache())
    );
  }

  updateCourse(id: string, courseId: string, courseName: string, duration?: string, status?: string): Observable<Course> {
    return this.http.patch<Course>(`${this.baseUrl}/courses/${id}`, { courseId, courseName, duration, status }, this.getHeaders()).pipe(
      tap(() => this.clearCoursesCache())
    );
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/courses/${id}`, this.getHeaders()).pipe(
      tap(() => this.clearCoursesCache())
    );
  }

  getCourseDetail(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/${id}`, this.getHeaders());
  }

  lookupCourse(courseIdCode: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/lookup/${courseIdCode}`);
  }

  // Quiz Categories API (with shareReplay caching)
  getCategories(): Observable<any[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http.get<any[]>(`${this.baseUrl}/quizzes/categories`, this.getHeaders()).pipe(
        shareReplay(1)
      );
    }
    return this.categoriesCache$;
  }

  createCategory(name: string, description?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quizzes/categories`, { name, description }, this.getHeaders()).pipe(
      tap(() => this.clearCategoriesCache())
    );
  }

  // Quizzes API
  getQuizzes(courseId?: string): Observable<Quiz[]> {
    const url = courseId ? `${this.baseUrl}/quizzes?courseId=${courseId}` : `${this.baseUrl}/quizzes`;
    return this.http.get<any[]>(url, this.getHeaders()).pipe(
      map(list => list.map(q => this.mapQuizResponse(q)))
    );
  }

  getQuizzesByCourse(courseId: string): Observable<Quiz[]> {
    return this.http.get<any[]>(`${this.baseUrl}/quizzes/course/${courseId}`).pipe(
      map(list => list.map(q => this.mapQuizResponse(q)))
    );
  }

  getQuizDetail(id: string): Observable<Quiz> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/${id}`, this.getHeaders()).pipe(
      map(q => this.mapQuizResponse(q))
    );
  }

  getQuizForStudent(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/student/${id}`, this.getHeaders());
  }

  createQuiz(data: any): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.baseUrl}/quizzes`, data, this.getHeaders());
  }

  updateQuiz(id: string, data: any): Observable<Quiz> {
    return this.http.patch<Quiz>(`${this.baseUrl}/quizzes/${id}`, data, this.getHeaders());
  }

  deleteQuiz(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/quizzes/${id}`, this.getHeaders());
  }

  duplicateQuiz(id: string): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.baseUrl}/quizzes/${id}/duplicate`, {}, this.getHeaders());
  }

  publishQuiz(id: string): Observable<Quiz> {
    return this.http.patch<Quiz>(`${this.baseUrl}/quizzes/${id}/publish`, {}, this.getHeaders());
  }

  unpublishQuiz(id: string): Observable<Quiz> {
    return this.http.patch<Quiz>(`${this.baseUrl}/quizzes/${id}/unpublish`, {}, this.getHeaders());
  }

  // Question Bank API
  getQuestionBank(params: {
    courseId?: string;
    difficulty?: string;
    questionType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    let query = '';
    const parts: string[] = [];
    if (params.courseId) parts.push(`courseId=${params.courseId}`);
    if (params.difficulty) parts.push(`difficulty=${params.difficulty}`);
    if (params.questionType) parts.push(`questionType=${params.questionType}`);
    if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.page) parts.push(`page=${params.page}`);
    if (params.limit) parts.push(`limit=${params.limit}`);
    
    if (parts.length > 0) {
      query = '?' + parts.join('&');
    }
    return this.http.get<any>(`${this.baseUrl}/question-bank${query}`, this.getHeaders());
  }

  getQuestionFromBank(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/question-bank/${id}`, this.getHeaders());
  }

  createQuestionInBank(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/question-bank`, data, this.getHeaders());
  }

  updateQuestionInBank(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/question-bank/${id}`, data, this.getHeaders());
  }

  deleteQuestionFromBank(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/question-bank/${id}`, this.getHeaders());
  }

  // Quiz Questions Linkage API
  addQuestionsToQuiz(quizId: string, questionIds: string[], marks?: number): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.baseUrl}/quizzes/${quizId}/questions`, { questionIds, marks }, this.getHeaders());
  }

  removeQuestionFromQuiz(quizId: string, questionId: string): Observable<Quiz> {
    return this.http.delete<Quiz>(`${this.baseUrl}/quizzes/${quizId}/questions/${questionId}`, this.getHeaders());
  }

  updateQuizQuestionMarks(quizId: string, questionId: string, marks: number): Observable<Quiz> {
    return this.http.patch<Quiz>(`${this.baseUrl}/quizzes/${quizId}/questions/${questionId}/marks`, { marks }, this.getHeaders());
  }

  reorderQuestions(quizId: string, questionIds: string[]): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/quizzes/${quizId}/questions/reorder`, { questionIds }, this.getHeaders());
  }

  // Upload media
  uploadMedia(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/quizzes/media/upload`, formData, this.getHeaders());
  }

  // Student quiz attempts
  startQuizAttempt(quizId: string, studentId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quizzes/${quizId}/start`, { studentId }, this.getHeaders());
  }

  submitQuiz(submissionId: string, answers: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quizzes/submit`, { submissionId, answers }, this.getHeaders());
  }

  getStudentSubmissionResult(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/submissions/student-result/${id}`, this.getHeaders());
  }

  getQuizSubmissions(studentId?: string): Observable<QuizSubmission[]> {
    const url = studentId ? `${this.baseUrl}/quizzes/submissions/list?studentId=${encodeURIComponent(studentId)}` : `${this.baseUrl}/quizzes/submissions/list`;
    return this.http.get<any[]>(url, this.getHeaders()).pipe(
      map(list => (list || []).map(sub => this.mapQuizSubmission(sub)))
    );
  }

  exportQuizSubmissions(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/quizzes/submissions/export`, {
      headers: this.getHeaders().headers,
      responseType: 'blob'
    });
  }

  getQuizSubmissionDetail(id: string): Observable<QuizSubmission> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/submissions/${id}`, this.getHeaders()).pipe(
      map(sub => this.mapQuizSubmission(sub))
    );
  }

  evaluateSubmission(id: string, evaluations: { questionId: string; marksAwarded: number; feedback?: string }[]): Observable<QuizSubmission> {
    return this.http.patch<QuizSubmission>(`${this.baseUrl}/quizzes/submissions/${id}/evaluate`, { evaluations }, this.getHeaders());
  }

  deleteQuizSubmission(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/quizzes/submissions/${id}`, this.getHeaders());
  }

  getLeaderboard(quizId: string): Observable<QuizSubmission[]> {
    return this.http.get<QuizSubmission[]>(`${this.baseUrl}/quizzes/${quizId}/leaderboard`, this.getHeaders());
  }

  getAnalytics(quizId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/${quizId}/analytics`, this.getHeaders());
  }

  // Assignments API
  getAssignments(courseId?: string): Observable<Assignment[]> {
    const target = (courseId && courseId.trim() !== '') ? courseId : 'all';
    return this.http.get<Assignment[]>(`${this.baseUrl}/assignments/course/${target}`, this.getHeaders());
  }

  submitAssignment(formData: FormData): Observable<AssignmentSubmission> {
    return this.http.post<AssignmentSubmission>(`${this.baseUrl}/assignments/submit`, formData, this.getHeaders());
  }

  getStudentSubmissions(studentName: string, collegeName: string): Observable<AssignmentSubmission[]> {
    return this.http.get<AssignmentSubmission[]>(
      `${this.baseUrl}/assignments/student/submissions?studentName=${encodeURIComponent(studentName)}&collegeName=${encodeURIComponent(collegeName)}`,
      this.getHeaders()
    );
  }

  createAssignment(
    courseId: string,
    title: string,
    description?: string,
    deadline?: string,
    instructions?: string,
    expectedOutcome?: string,
    rubric?: any,
    maxMarks?: number,
  ): Observable<Assignment> {
    return this.http.post<Assignment>(
      `${this.baseUrl}/assignments`,
      { courseId, title, description, deadline, instructions, expectedOutcome, rubric, maxMarks },
      this.getHeaders(),
    );
  }

  deleteAssignment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/assignments/${id}`, this.getHeaders());
  }

  updateAssignment(id: string, payload: Partial<Assignment>): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.baseUrl}/assignments/${id}`, payload, this.getHeaders());
  }

  getAssignmentSubmissions(courseId?: string): Observable<AssignmentSubmission[]> {
    const query = (courseId && courseId.trim() !== '') ? `?courseId=${courseId}` : '';
    return this.http.get<AssignmentSubmission[]>(`${this.baseUrl}/assignments/submissions${query}`, this.getHeaders());
  }

  gradeAssignmentSubmission(id: string, marks: number, feedback: string): Observable<AssignmentSubmission> {
    return this.http.patch<AssignmentSubmission>(`${this.baseUrl}/assignments/submissions/${id}/grade`, { marks, feedback }, this.getHeaders());
  }

  // AI Evaluation Endpoints
  retryAiEvaluation(submissionId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ai-evaluation/evaluate/${submissionId}`, {}, this.getHeaders());
  }

  publishAiGrade(submissionId: string, marks: number, feedback: string, overrideComment?: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/ai-evaluation/publish/${submissionId}`,
      { marks, feedback, overrideComment },
      this.getHeaders(),
    );
  }

  getAiEvaluationDetail(submissionId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/ai-evaluation/submission/${submissionId}`, this.getHeaders());
  }

  downloadSubmissionFile(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/assignments/submissions/${id}/download`, {
      ...this.getHeaders(),
      responseType: 'blob'
    });
  }

  importQuestions(courseId: string, file: File): Observable<any> {
    const token = localStorage.getItem('edinz_admin_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    return this.http.post<any>(`${this.baseUrl}/question-bank/import`, formData, { headers });
  }

  bulkSaveQuestions(courseId: string, questions: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/question-bank/bulk-save`, { courseId, questions }, this.getHeaders());
  }

  downloadQuestionTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/question-bank/template/download`, {
      ...this.getHeaders(),
      responseType: 'blob'
    });
  }

  private mapQuizResponse(q: any): Quiz {
    if (!q) return q;

    const mappedQuestions = (q.questions || []).map((item: any) => {
      const qObj = item.question || item;
      return {
        id: item.id || qObj.id,
        questionId: item.questionId || qObj.id,
        questionText: qObj.question || qObj.questionText || '',
        questionType: qObj.questionType || item.questionType || 'MCQ_SINGLE',
        mark: item.marks !== undefined ? item.marks : (qObj.mark || 1),
        explanation: qObj.explanation || item.explanation || '',
        caseSensitive: qObj.caseSensitive || item.caseSensitive || false,
        sampleAnswer: qObj.sampleAnswer || item.sampleAnswer || '',
        correctAnswerText: qObj.correctAnswerText || item.correctAnswerText || '',
        options: (qObj.options || item.options || []).map((o: any) => ({
          id: o.id,
          optionText: o.optionText || o.text || '',
          isCorrect: o.isCorrect || false
        }))
      };
    });

    let totalMarks = 0;
    if (mappedQuestions.length > 0) {
      totalMarks = mappedQuestions.reduce((sum: number, item: any) => sum + (item.mark || 0), 0);
    }

    return {
      ...q,
      quizTitle: q.title || q.quizTitle || 'Untitled Quiz',
      startTime: q.publishAt || q.startTime || '',
      endTime: q.expireAt || q.endTime || '',
      totalMarks: totalMarks || q.totalMarks || 0,
      questions: mappedQuestions
    };
  }

  private mapQuizSubmission(sub: any): QuizSubmission {
    if (!sub) return sub;

    const quiz = sub.quiz || {};
    const course = quiz.course || {};
    const student = sub.student || {};
    const questions = quiz.questions || [];
    const answersList = sub.answers || sub.studentAnswers || [];

    let computedTotalMarks = questions.reduce((sum: number, q: any) => {
      const m = q.marks !== undefined ? q.marks : (q.mark !== undefined ? q.mark : (q.question?.mark || 1));
      return sum + Number(m || 1);
    }, 0);

    if (computedTotalMarks === 0) {
      computedTotalMarks = answersList.length || questions.length || (sub.score > 0 ? sub.score : 0);
    }

    const score = sub.score || 0;
    if (score > computedTotalMarks) {
      computedTotalMarks = score;
    }

    const totalMarks = computedTotalMarks;
    const percentage = totalMarks > 0 ? Math.min(100, Math.round((score / totalMarks) * 100)) : 0;

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const mappedAnswers = questions.map((qq: any) => {
      const qObj = qq.question || qq;
      const questionId = qObj.id || qq.questionId;
      const sa = answersList.find((a: any) => a.questionId === questionId || a.question?.id === questionId);

      const options = (qObj.options || []).map((opt: any) => ({
        id: opt.id,
        optionText: opt.optionText || opt.text || '',
        isCorrect: opt.isCorrect || false
      }));

      let selectedOpts: string[] = [];
      if (sa) {
        if (Array.isArray(sa.selectedOptions)) {
          selectedOpts = sa.selectedOptions;
        } else if (Array.isArray(sa.selectedOptionIds)) {
          selectedOpts = sa.selectedOptionIds;
        } else if (sa.selectedOptionId) {
          selectedOpts = [sa.selectedOptionId];
        } else if (sa.selectedOption?.id) {
          selectedOpts = [sa.selectedOption.id];
        }
      }

      const qMark = qq.marks !== undefined ? qq.marks : (qObj.mark || 1);
      const awarded = sa ? (sa.marksAwarded !== undefined ? sa.marksAwarded : sa.awardedMarks) : null;

      if (awarded !== null && awarded !== undefined) {
        if (awarded > 0) {
          correctCount++;
        } else if (selectedOpts.length > 0 || sa?.typedAnswerText || sa?.essayAnswer) {
          wrongCount++;
        } else {
          unansweredCount++;
        }
      } else {
        if (selectedOpts.length === 0 && !sa?.typedAnswerText && !sa?.essayAnswer) {
          unansweredCount++;
        }
      }

      return {
        id: sa?.id || questionId,
        questionId: questionId,
        awardedMarks: awarded,
        selectedOptions: selectedOpts,
        selectedOptionId: selectedOpts[0] || null,
        typedAnswerText: sa?.typedAnswerText || sa?.typedAnswer || sa?.essayAnswer || '',
        typedAnswer: sa?.typedAnswer || sa?.typedAnswerText || sa?.essayAnswer || '',
        essayAnswer: sa?.essayAnswer || '',
        question: {
          id: questionId,
          questionText: qObj.question || qObj.questionText || '',
          questionType: qObj.questionType || 'MCQ_SINGLE',
          mark: qMark,
          explanation: qObj.explanation,
          options: options
        }
      };
    });

    let status = 'Pending Evaluation';
    if (sub.isEvaluated || sub.passed !== undefined) {
      if (sub.isEvaluated) {
        status = score >= (quiz.passingMarks || 0) ? 'Pass' : 'Fail';
      } else if (sub.passed !== undefined && sub.passed !== null) {
        status = sub.passed ? 'Pass' : 'Fail';
      }
    }

    return {
      id: sub.id,
      studentName: student.name || sub.studentName || 'Student',
      collegeName: student.collegeName || sub.collegeName || 'N/A',
      courseId: course.courseId || sub.courseId || '-',
      courseName: course.courseName || sub.courseName || '-',
      score: score,
      totalMarks: totalMarks,
      percentage: percentage,
      correctCount: correctCount,
      wrongCount: wrongCount,
      unansweredCount: unansweredCount,
      status: status,
      submittedAt: sub.submittedAt,
      quiz: {
        id: quiz.id,
        quizTitle: quiz.title || quiz.quizTitle || 'Quiz',
        totalMarks: totalMarks,
        passingMarks: quiz.passingMarks || 0,
        ...quiz
      },
      student: student,
      studentAnswers: mappedAnswers
    };
  }

  // --- Student Activity Methods ---
  getStudentActivityLogs(filterType?: string, filterValue?: string, courseId?: string): Observable<any[]> {
    let params: string[] = [];
    if (filterType) params.push(`filterType=${encodeURIComponent(filterType)}`);
    if (filterValue) params.push(`filterValue=${encodeURIComponent(filterValue)}`);
    if (courseId) params.push(`courseId=${encodeURIComponent(courseId)}`);

    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<any[]>(`${this.baseUrl}/courses/activity/logs${query}`, this.getHeaders());
  }

  getStudentActivitySummary(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/courses/activity/summary`, this.getHeaders());
  }

  recordCourseAccess(courseId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/courses/activity/course-access`, { courseId }, this.getHeaders());
  }
}


