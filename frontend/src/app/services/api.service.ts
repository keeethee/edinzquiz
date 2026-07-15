import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Course {
  id: number;
  courseId: string; // display ID like 'CS-101'
  courseName: string;
  duration?: string;
  status: string;
}

export interface Option {
  id: number;
  optionText: string;
  isCorrect?: boolean;
}

export interface Question {
  id: number;
  questionText: string;
  questionType: string; // 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'TF' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'ESSAY' | 'MCQ' | 'FillBlank' | 'Subjective'
  mark: number;
  correctAnswerText?: string;
  options: Option[];
  orderIndex?: number;
  explanation?: string;
  caseSensitive?: boolean;
  sampleAnswer?: string;
}

export interface Quiz {
  id: number;
  quizTitle: string;
  startTime: string;
  endTime: string;
  status: string; // 'Draft' | 'Published' | 'Closed' | 'Force stopped' | 'Archived'
  totalMarks: number;
  duration: number; // in minutes
  passingMarks: number;
  negativeMarkingEnabled: boolean;
  negativeMarkingValue: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  resultsPublished: boolean;
  course?: Course;
  questions?: Question[];
  description?: string;
  difficulty?: string; // 'Easy' | 'Medium' | 'Hard'
  category?: { id: number; name: string } | null;
  settings?: {
    maxAttempts: number;
    passingPercentage: number;
    showResultsImmediately: boolean;
  };
}

export interface StudentAnswer {
  id: number;
  isCorrect: boolean;
  typedAnswerText: string | null;
  awardedMarks: number | null; // Null represents 'Pending Evaluation'
  question: Question;
  selectedOption: Option | null;
}

export interface QuizSubmission {
  id: number;
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
  status: string; // 'Pass' | 'Fail' | 'Pending Evaluation'
  submittedAt: string;
  timeTakenSeconds?: number;
  grade?: string;
  quiz?: Quiz;
  student?: any;
  studentAnswers?: StudentAnswer[];
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  deadline: string;
  course?: Course;
}

export interface AssignmentSubmission {
  id: number;
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

  // Courses
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.baseUrl}/courses`, this.getHeaders());
  }

  createCourse(courseId: string, courseName: string, duration?: string, status: string = 'Active'): Observable<Course> {
    return this.http.post<Course>(`${this.baseUrl}/courses`, { courseId, courseName, duration, status }, this.getHeaders());
  }

  updateCourse(id: number, courseId: string, courseName: string, duration?: string, status?: string): Observable<Course> {
    return this.http.patch<Course>(`${this.baseUrl}/courses/${id}`, { courseId, courseName, duration, status }, this.getHeaders());
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/courses/${id}`, this.getHeaders());
  }

  getCourse(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/${id}`, this.getHeaders());
  }

  // Student public course lookup by display ID code
  lookupCourse(courseIdCode: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/lookup/${courseIdCode}`);
  }

  // Categories API
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/quizzes/categories`, this.getHeaders());
  }

  // Quizzes API
  getQuizzes(courseId: number): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.baseUrl}/quizzes/course/${courseId}`);
  }

  getQuiz(id: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.baseUrl}/quizzes/${id}`, this.getHeaders());
  }

  getQuizForStudent(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/student/${id}`, this.getHeaders());
  }

  createQuiz(
    courseId: number,
    quizTitle: string,
    startTime: string,
    endTime: string,
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
    settings?: { maxAttempts?: number; passingPercentage?: number; showResultsImmediately?: boolean }
  ): Observable<Quiz> {
    return this.http.post<Quiz>(
      `${this.baseUrl}/quizzes`,
      {
        courseId,
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
        description,
        difficulty,
        categoryId,
        settings
      },
      this.getHeaders()
    );
  }

  updateQuizTiming(id: number, startTime?: string, endTime?: string, status?: string, resultsPublished?: boolean): Observable<Quiz> {
    return this.http.patch<Quiz>(`${this.baseUrl}/quizzes/${id}/timing`, { startTime, endTime, status, resultsPublished }, this.getHeaders());
  }

  updateQuiz(id: number, data: any): Observable<Quiz> {
    return this.http.patch<Quiz>(`${this.baseUrl}/quizzes/${id}`, data, this.getHeaders());
  }

  duplicateQuiz(id: number): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.baseUrl}/quizzes/${id}/duplicate`, {}, this.getHeaders());
  }

  deleteQuiz(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/quizzes/${id}`, this.getHeaders());
  }

  // Questions API
  addQuestion(
    quizId: number,
    questionText: string,
    questionType: string,
    mark: number,
    correctAnswerText?: string,
    options?: { optionText: string; isCorrect: boolean }[]
  ): Observable<Question> {
    return this.http.post<Question>(`${this.baseUrl}/quizzes/questions`, { quizId, questionText, questionType, mark, correctAnswerText, options }, this.getHeaders());
  }

  updateQuestion(id: number, data: any): Observable<Question> {
    return this.http.patch<Question>(`${this.baseUrl}/quizzes/questions/${id}`, data, this.getHeaders());
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/quizzes/questions/${id}`, this.getHeaders());
  }

  updateAnswerKey(questionId: number, correctOptionId: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/quizzes/questions/${questionId}/answer-key`, { correctOptionId }, this.getHeaders());
  }

  reorderQuestions(quizId: number, questionIds: number[]): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/quizzes/${quizId}/questions/reorder`, { questionIds }, this.getHeaders());
  }

  // Upload quiz files/images
  uploadMedia(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/quizzes/media/upload`, formData, this.getHeaders());
  }

  // Submissions API
  submitQuiz(quizId: number, studentId: number, answers: { questionId: number; selectedOptionId?: number; selectedOptionIds?: number[]; typedAnswerText?: string }[], timeTakenSeconds: number = 0): Observable<QuizSubmission> {
    return this.http.post<QuizSubmission>(`${this.baseUrl}/quizzes/submit`, { quizId, studentId, answers, timeTakenSeconds }, this.getHeaders());
  }

  getStudentSubmissionResult(id: number, studentId: number): Observable<QuizSubmission> {
    return this.http.post<QuizSubmission>(`${this.baseUrl}/quizzes/submissions/student-result/${id}`, { studentId }, this.getHeaders());
  }

  getAttemptStats(quizId: number, studentId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quizzes/${quizId}/attempt-stats`, { studentId }, this.getHeaders());
  }

  getQuizSubmissions(): Observable<QuizSubmission[]> {
    return this.http.get<QuizSubmission[]>(`${this.baseUrl}/quizzes/submissions/list`, this.getHeaders());
  }


  getQuizSubmissionDetail(id: number): Observable<QuizSubmission> {
    return this.http.get<QuizSubmission>(`${this.baseUrl}/quizzes/submissions/${id}`, this.getHeaders());
  }

  exportQuizSubmissions(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/quizzes/submissions/export`, {
      ...this.getHeaders(),
      responseType: 'blob'
    });
  }

  evaluateSubmission(id: number, evaluations: { questionId: number; marks: number }[]): Observable<QuizSubmission> {
    return this.http.patch<QuizSubmission>(`${this.baseUrl}/quizzes/submissions/${id}/evaluate`, { evaluations }, this.getHeaders());
  }

  getLeaderboard(quizId: number): Observable<QuizSubmission[]> {
    return this.http.get<QuizSubmission[]>(`${this.baseUrl}/quizzes/${quizId}/leaderboard`, this.getHeaders());
  }

  getAnalytics(quizId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/quizzes/${quizId}/analytics`, this.getHeaders());
  }

  // Assignments API
  getAssignments(courseId: number): Observable<Assignment[]> {
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

  createAssignment(courseId: number, title: string, description: string, deadline: string): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.baseUrl}/assignments`, { courseId, title, description, deadline }, this.getHeaders());
  }

  deleteAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/assignments/${id}`, this.getHeaders());
  }

  updateAssignment(id: number, payload: Partial<Assignment>): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.baseUrl}/assignments/${id}`, payload, this.getHeaders());
  }

  getAssignmentSubmissions(): Observable<AssignmentSubmission[]> {
    return this.http.get<AssignmentSubmission[]>(`${this.baseUrl}/assignments/submissions`, this.getHeaders());
  }

  gradeAssignmentSubmission(id: number, marks: number, feedback: string): Observable<AssignmentSubmission> {
    return this.http.patch<AssignmentSubmission>(`${this.baseUrl}/assignments/submissions/${id}/grade`, { marks, feedback }, this.getHeaders());
  }

  downloadSubmissionFile(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/assignments/submissions/${id}/download`, {
      ...this.getHeaders(),
      responseType: 'blob'
    });
  }
}
