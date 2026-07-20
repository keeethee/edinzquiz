import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

export interface StudentAnswer {
  id: string;
  isCorrect: boolean;
  typedAnswerText: string | null;
  awardedMarks: number | null;
  question: Question;
  selectedOption: Option | null;
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
  status: string;
  submittedAt: string;
  timeTakenSeconds?: number;
  grade?: string;
  quiz?: Quiz;
  student?: any;
  studentAnswers?: StudentAnswer[];
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  course?: Course;
}

export interface AssignmentSubmission {
  id: string;
  studentName: string;
  collegeName: string;
  courseName: string;
  fileName: string;
  filePath: string;
  submittedAt: string;
  marks: number | null;
  feedback: string | null;
  course: Course;
  assignment?: Assignment | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    let headers = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('edinz_admin_token') || localStorage.getItem('edinz_student_token');
      if (token) {
        headers = { 'Authorization': `Bearer ${token}` };
      }
    }
    return { headers };
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

  // Courses API
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.baseUrl}/courses`, this.getHeaders());
  }

  createCourse(courseId: string, courseName: string, duration?: string, status: string = 'Active'): Observable<Course> {
    return this.http.post<Course>(`${this.baseUrl}/courses`, { courseId, courseName, duration, status }, this.getHeaders());
  }

  updateCourse(id: string, courseId: string, courseName: string, duration?: string, status?: string): Observable<Course> {
    return this.http.patch<Course>(`${this.baseUrl}/courses/${id}`, { courseId, courseName, duration, status }, this.getHeaders());
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/courses/${id}`, this.getHeaders());
  }

  getCourseDetail(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/${id}`, this.getHeaders());
  }

  lookupCourse(courseIdCode: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/lookup/${courseIdCode}`);
  }

  // Quiz Categories API
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/quizzes/categories`, this.getHeaders());
  }

  createCategory(name: string, description?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quizzes/categories`, { name, description }, this.getHeaders());
  }

  // Quizzes API
  getQuizzes(courseId?: string): Observable<Quiz[]> {
    const url = courseId ? `${this.baseUrl}/quizzes?courseId=${courseId}` : `${this.baseUrl}/quizzes`;
    return this.http.get<Quiz[]>(url, this.getHeaders());
  }

  getQuizzesByCourse(courseId: string): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.baseUrl}/quizzes/course/${courseId}`);
  }

  getQuizDetail(id: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.baseUrl}/quizzes/${id}`, this.getHeaders());
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

  getQuizSubmissions(): Observable<QuizSubmission[]> {
    return this.http.get<QuizSubmission[]>(`${this.baseUrl}/quizzes/submissions/list`, this.getHeaders());
  }

  getQuizSubmissionDetail(id: string): Observable<QuizSubmission> {
    return this.http.get<QuizSubmission>(`${this.baseUrl}/quizzes/submissions/${id}`, this.getHeaders());
  }

  evaluateSubmission(id: string, evaluations: { questionId: string; marksAwarded: number; feedback?: string }[]): Observable<QuizSubmission> {
    return this.http.patch<QuizSubmission>(`${this.baseUrl}/quizzes/submissions/${id}/evaluate`, { evaluations }, this.getHeaders());
  }

  getLeaderboard(quizId: string): Observable<QuizSubmission[]> {
    return this.http.get<QuizSubmission[]>(`${this.baseUrl}/quizzes/${quizId}/leaderboard`, this.getHeaders());
  }

  getAnalytics(quizId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/${quizId}/analytics`, this.getHeaders());
  }

  // Assignments API
  getAssignments(courseId: string): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.baseUrl}/assignments/course/${courseId}`, this.getHeaders());
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

  createAssignment(courseId: string, title: string, description: string, deadline: string): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.baseUrl}/assignments`, { courseId, title, description, deadline }, this.getHeaders());
  }

  deleteAssignment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/assignments/${id}`, this.getHeaders());
  }

  updateAssignment(id: string, payload: Partial<Assignment>): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.baseUrl}/assignments/${id}`, payload, this.getHeaders());
  }

  getAssignmentSubmissions(): Observable<AssignmentSubmission[]> {
    return this.http.get<AssignmentSubmission[]>(`${this.baseUrl}/assignments/submissions`, this.getHeaders());
  }

  gradeAssignmentSubmission(id: string, marks: number, feedback: string): Observable<AssignmentSubmission> {
    return this.http.patch<AssignmentSubmission>(`${this.baseUrl}/assignments/submissions/${id}/grade`, { marks, feedback }, this.getHeaders());
  }

  downloadSubmissionFile(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/assignments/submissions/${id}/download`, {
      ...this.getHeaders(),
      responseType: 'blob'
    });
  }
}
