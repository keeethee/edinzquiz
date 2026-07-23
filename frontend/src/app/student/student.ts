import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Course, Question, Option, Quiz, Assignment, QuizSubmission, StudentAnswer, AssignmentSubmission } from '../services/api.service';
import { AuthService, StudentDetails } from '../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student.html',
  styleUrls: ['./student.css']
})
export class StudentComponent implements OnInit, OnDestroy {
  activeTab: 'quiz' | 'assignment' | 'results' = 'quiz';

  // Auth Screen state
  authMode: 'login' | 'register' = 'login';
  loginEmail = '';
  loginPassword = '';
  showLoginPassword = false;
  
  regEmail = '';
  regPassword = '';
  regName = '';
  regCollege = '';
  showRegisterPassword = false;
  
  loggedInStudent: StudentDetails | null = null;

  // General Portal State
  errorMsg = '';
  successMsg = '';
  searchCourseIdCode = '';
  activeCourse: Course | null = null;

  // Attempt State
  quizzes: Quiz[] = [];
  selectedQuiz: any = null;
  quizQuestions: Partial<Question>[] = [];
  
  // Quiz Responses
  selectedOptions: Record<string, string> = {}; // questionId -> optionId (for MCQ/TF)
  selectedOptionsMultiple: Record<string, Record<string, boolean>> = {}; // questionId -> optionId -> boolean
  typedAnswers: Record<string, string> = {};    // questionId -> text (for FillBlank/Subjective)
  
  quizStep: 'search' | 'dashboard' | 'details' | 'attempt' | 'success' | 'result' = 'search';
  quizStartedAt: Date | null = null;
  resultSubmission: QuizSubmission | null = null;
  attemptStats: any = null;

  // Timing & Auto-save
  countdownSeconds = 0;
  countdownDisplay = '';
  timerInterval: any = null;
  autoSaveInterval: any = null;

  // Assignments
  assignments: Assignment[] = [];
  selectedAssignment: Assignment | null = null;
  assignStep: 'dashboard' | 'upload' | 'success' = 'dashboard';
  selectedFile: File | null = null;
  fileName = '';
  studentSubmissions: AssignmentSubmission[] = [];

  // Results History
  allSubmissions: QuizSubmission[] = [];
  detailedSubmission: QuizSubmission | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.authService.getStudent().subscribe(student => {
      this.loggedInStudent = student;
      if (student) {
        const savedCourse = localStorage.getItem('edinz_active_course');
        if (savedCourse) {
          try {
            this.activeCourse = JSON.parse(savedCourse);
          } catch (e) {
            this.activeCourse = null;
          }
        }
        this.resetState();
        this.loadHistoricalResults();
      } else {
        this.activeCourse = null;
        localStorage.removeItem('edinz_active_course');
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.clearAutoSave();
  }

  switchTab(tab: 'quiz' | 'assignment' | 'results') {
    this.activeTab = tab;
    this.errorMsg = '';
    this.successMsg = '';
    this.detailedSubmission = null;
    
    if (this.activeCourse) {
      if (tab === 'quiz') {
        this.quizStep = 'dashboard';
        this.loadQuizzes(this.activeCourse.id);
      } else if (tab === 'assignment') {
        this.assignStep = 'dashboard';
        this.loadAssignments(this.activeCourse.id);
      } else {
        this.loadHistoricalResults();
      }
    }
  }

  // --- Student Auth operations ---
  onStudentRegister() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.regEmail || !this.regPassword || !this.regName || !this.regCollege) {
      this.errorMsg = 'Please fill out all registration fields.';
      return;
    }

    this.authService.registerStudent(this.regEmail, this.regPassword, this.regName, this.regCollege).subscribe({
      next: () => {
        this.successMsg = 'Account created successfully! Please sign in.';
        this.authMode = 'login';
        this.loginEmail = this.regEmail;
        this.regEmail = '';
        this.regPassword = '';
        this.regName = '';
        this.regCollege = '';
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Failed to create student account.';
      }
    });
  }

  onStudentLogin() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMsg = 'Email and password are required.';
      return;
    }

    this.authService.loginStudent(this.loginEmail, this.loginPassword).subscribe({
      next: () => {
        this.loginEmail = '';
        this.loginPassword = '';
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Invalid email or password.';
      }
    });
  }

  onStudentLogout() {
    this.authService.logoutStudent();
    this.activeCourse = null;
    localStorage.removeItem('edinz_active_course');
    this.allSubmissions = [];
  }

  // Course Lookup
  onCourseSearch() {
    this.errorMsg = '';
    if (!this.searchCourseIdCode.trim()) {
      this.errorMsg = 'Please enter a valid Course ID.';
      return;
    }

    this.apiService.lookupCourse(this.searchCourseIdCode.trim()).subscribe({
      next: (course) => {
        this.activeCourse = course;
        localStorage.setItem('edinz_active_course', JSON.stringify(course));
        this.resetState();
      },
      error: () => {
        this.errorMsg = 'Course not found or is currently inactive.';
        this.activeCourse = null;
        localStorage.removeItem('edinz_active_course');
      }
    });
  }

  exitCourse() {
    this.activeCourse = null;
    localStorage.removeItem('edinz_active_course');
    this.resetState();
  }

  resetState() {
    this.errorMsg = '';
    this.successMsg = '';
    this.clearTimer();
    this.clearAutoSave();
    
    // Quiz resets
    this.quizStep = this.activeCourse ? 'dashboard' : 'search';
    this.selectedQuiz = null;
    this.quizQuestions = [];
    this.selectedOptions = {};
    this.selectedOptionsMultiple = {};
    this.typedAnswers = {};
    this.quizStartedAt = null;
    this.resultSubmission = null;
    this.attemptStats = null;
    
    // Assignment resets
    this.assignStep = 'dashboard';
    this.selectedAssignment = null;
    this.selectedFile = null;
    this.fileName = '';

    if (this.activeCourse) {
      if (this.activeTab === 'quiz') this.loadQuizzes(this.activeCourse.id);
      if (this.activeTab === 'assignment') this.loadAssignments(this.activeCourse.id);
    }
  }

  // ==================== QUIZ MODULE ====================

  quizSearchText: string = '';

  get filteredQuizzes(): Quiz[] {
    let list = this.quizzes || [];
    if (this.quizSearchText.trim()) {
      const txt = this.quizSearchText.toLowerCase();
      list = list.filter(q => q.quizTitle.toLowerCase().includes(txt) || (q.description && q.description.toLowerCase().includes(txt)));
    }
    return list;
  }

  get isTimerWarning(): boolean {
    return this.countdownSeconds > 0 && this.countdownSeconds <= 120;
  }

  loadQuizzes(courseId: string) {
    this.apiService.getQuizzes(courseId).subscribe({
      next: (list) => {
        this.quizzes = list.filter(q => q.status !== 'Draft');
      },
      error: () => {
        this.errorMsg = 'Failed to load quizzes.';
      }
    });
  }

  getQuizStatusLabel(q: Quiz): string {
    if (q.status === 'Draft') return 'Draft';
    if (q.status === 'Force stopped') return 'Force Stopped';
    if (q.status === 'Closed') return 'Closed';
    if (q.status === 'Archived') return 'Archived';

    const now = new Date();
    const startStr = q.startTime || (q as any).publishAt;
    const endStr = q.endTime || (q as any).expireAt;

    if (startStr) {
      const start = new Date(startStr);
      if (!isNaN(start.getTime()) && now < start) return 'Not Started Yet';
    }
    if (endStr) {
      const end = new Date(endStr);
      if (!isNaN(end.getTime()) && now > end) return 'Expired / Time Exceeded';
    }
    return 'Active';
  }

  isQuizAttemptable(q: Quiz): boolean {
    if (!q) return false;
    if (q.status !== 'Published') return false;
    if (this.hasSubmittedQuiz(q.id)) return false;

    const now = new Date();
    const startStr = q.startTime || (q as any).publishAt;
    const endStr = q.endTime || (q as any).expireAt;

    if (startStr) {
      const start = new Date(startStr);
      if (!isNaN(start.getTime()) && now < start) return false;
    }
    if (endStr) {
      const end = new Date(endStr);
      if (!isNaN(end.getTime()) && now > end) return false;
    }

    return true;
  }

  hasSubmittedQuiz(quizId: string): boolean {
    return this.allSubmissions.some(s => s.quiz?.id === quizId);
  }

  startQuizAttemptFlow(quiz: Quiz) {
    if (!this.isQuizAttemptable(quiz)) {
      this.errorMsg = 'This quiz has expired or is not currently open for attempt.';
      return;
    }
    this.selectedQuiz = quiz;
    this.quizStep = 'details';
  }

  currentSubmissionId = '';

  onQuizDetailsConfirm() {
    this.errorMsg = '';
    if (!this.loggedInStudent || !this.selectedQuiz) return;

    if (!this.isQuizAttemptable(this.selectedQuiz)) {
      this.errorMsg = 'This quiz has expired or is not currently open for attempt.';
      return;
    }

    this.apiService.getQuizForStudent(this.selectedQuiz.id).subscribe({
      next: (res) => {
        this.apiService.startQuizAttempt(this.selectedQuiz.id, this.loggedInStudent!.id.toString()).subscribe({
          next: (attempt) => {
            this.currentSubmissionId = attempt.submissionId;

            // Setup questions & optionally shuffle them
            let loadedQs: Question[] = res.questions;
            this.quizQuestions = loadedQs;
            this.selectedOptions = {};
            this.typedAnswers = {};

            // Load saved draft if present
            this.restoreAttemptDraft();

            this.quizStep = 'attempt';
            this.quizStartedAt = new Date(attempt.startedAt || new Date());

            // Smart timer calculation considering remaining time until expireAt / endTime
            let secondsRemaining = (res.duration || 60) * 60;
            const endStr = res.endTime || (res as any).expireAt;
            if (endStr) {
              const endMs = new Date(endStr).getTime();
              const nowMs = new Date().getTime();
              const timeUntilEndSec = Math.floor((endMs - nowMs) / 1000);
              if (!isNaN(timeUntilEndSec) && timeUntilEndSec > 0) {
                secondsRemaining = Math.min(secondsRemaining, timeUntilEndSec);
              }
            }
            this.countdownSeconds = Math.max(0, secondsRemaining);

            this.startTimer();
            this.startAutoSave();
          },
          error: (err) => {
            this.errorMsg = err.error?.message || 'Failed to start quiz attempt. You may have reached the maximum attempts limit.';
          }
        });
      },
      error: () => {
        this.errorMsg = 'Failed to load quiz attempt. Please try again.';
      }
    });
  }

  shuffleArray(array: any[]): any[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // --- Draft Auto-Saving (Client-side localStorage) ---
  private getDraftKey(): string {
    return `quiz_draft_student_${this.loggedInStudent?.id}_quiz_${this.selectedQuiz?.id}`;
  }

  private saveAttemptDraft() {
    if (!this.selectedQuiz || !this.loggedInStudent) return;
    const draft = {
      selectedOptions: this.selectedOptions,
      selectedOptionsMultiple: this.selectedOptionsMultiple,
      typedAnswers: this.typedAnswers
    };
    localStorage.setItem(this.getDraftKey(), JSON.stringify(draft));
  }

  private restoreAttemptDraft() {
    const data = localStorage.getItem(this.getDraftKey());
    if (data) {
      try {
        const draft = JSON.parse(data);
        this.selectedOptions = draft.selectedOptions || {};
        this.selectedOptionsMultiple = draft.selectedOptionsMultiple || {};
        this.typedAnswers = draft.typedAnswers || {};
      } catch (e) {
        console.warn('Failed to restore draft', e);
      }
    }
  }

  private clearAttemptDraft() {
    if (this.selectedQuiz && this.loggedInStudent) {
      localStorage.removeItem(this.getDraftKey());
    }
  }

  startAutoSave() {
    this.clearAutoSave();
    this.autoSaveInterval = setInterval(() => {
      this.saveAttemptDraft();
    }, 5000); // Auto-save every 5 seconds
  }

  clearAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Timer logic
  startTimer() {
    this.clearTimer();
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (this.countdownSeconds > 0) {
        this.countdownSeconds--;
        this.updateTimerDisplay();
      } else {
        this.clearTimer();
        alert('Time expired! Submitting your answers automatically.');
        this.submitQuiz();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const hours = Math.floor(this.countdownSeconds / 3600);
    const minutes = Math.floor((this.countdownSeconds % 3600) / 60);
    const seconds = this.countdownSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      this.countdownDisplay = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      this.countdownDisplay = `${pad(minutes)}:${pad(seconds)}`;
    }
    this.cdr.detectChanges();
  }

  toggleOptionSelection(questionId: string, optionId: string) {
    if (!this.selectedOptionsMultiple[questionId]) {
      this.selectedOptionsMultiple[questionId] = {};
    }
    this.selectedOptionsMultiple[questionId][optionId] = !this.selectedOptionsMultiple[questionId][optionId];
    this.saveAttemptDraft();
  }

  isOptionSelected(questionId: string, optionId: string): boolean {
    return !!(this.selectedOptionsMultiple[questionId] && this.selectedOptionsMultiple[questionId][optionId]);
  }

  isOptionSelectedInSubmission(sa: StudentAnswer, optId: string): boolean {
    if (!sa) return false;
    if (sa.selectedOption && sa.selectedOption.id === optId) return true;
    if (sa.typedAnswerText) {
      try {
        const ids = JSON.parse(sa.typedAnswerText);
        if (Array.isArray(ids)) {
          return ids.map(String).includes(optId.toString());
        }
      } catch (e) {
        return sa.typedAnswerText.split(',').map(s => s.trim()).includes(optId.toString());
      }
    }
    return false;
  }

  // Submit attempt
  submitQuiz() {
    this.clearTimer();
    this.clearAutoSave();

    if (!this.loggedInStudent) return;

    // Build answers list
    const answersArray = this.quizQuestions.map(q => {
      const ansObj: any = { questionId: q.id };
      if (q.questionType === 'MCQ' || q.questionType === 'MCQ_SINGLE' || q.questionType === 'TF') {
        const selId = this.selectedOptions[q.id as any];
        ansObj.selectedOptionIds = selId ? [selId.toString()] : [];
      } else if (q.questionType === 'MCQ_MULTIPLE') {
        const selectedMap = this.selectedOptionsMultiple[q.id as any] || {};
        ansObj.selectedOptionIds = Object.keys(selectedMap)
          .filter(k => selectedMap[k as any])
          .map(k => k.toString());
      } else {
        ansObj.typedAnswerText = this.typedAnswers[q.id as any] || '';
      }
      return ansObj;
    });

    this.apiService.submitQuiz(
      this.currentSubmissionId,
      answersArray
    ).subscribe({
      next: (res) => {
        this.clearAttemptDraft();
        this.successMsg = 'Quiz submitted successfully!';
        
        // Fetch student-result details and attempt stats
        this.apiService.getStudentSubmissionResult(res.id).subscribe(detail => {
          this.resultSubmission = detail;
          this.quizStep = 'result';
          this.cdr.detectChanges();
        });

        this.loadHistoricalResults();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to submit quiz. Please contact your coordinator.';
      }
    });
  }

  // --- Grade helper utilities ---
  getGradeClass(grade?: string): string {
    if (!grade) return 'badge-secondary';
    switch (grade) {
      case 'Excellent': return 'badge-success';
      case 'Passed': return 'badge-primary';
      case 'Average': return 'badge-warning';
      case 'Failed': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getPerformanceFeedback(sub: QuizSubmission): string {
    if (sub.status === 'Pending Evaluation') {
      return 'Your answers are currently being evaluated by a tutor. Please check back later.';
    }
    const pct = sub.percentage;
    if (pct >= 80) {
      return 'Excellent! You have shown strong programming fundamentals and an outstanding grasp of the material.';
    } else if (pct >= 60) {
      return 'Passed! Good job, you have understood the concepts well. Keep practicing to reach excellence.';
    } else if (pct >= 40) {
      return 'Average. You passed, but we recommend revising the core topics and taking more practice quizzes.';
    } else {
      return 'Failed. Do not worry! Revise the lectures, look over the question explanations, and try again.';
    }
  }

  getFormattedTimeTaken(seconds?: number): string {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ==================== ASSIGNMENTS MODULE ====================

  loadAssignments(courseId: string) {
    this.apiService.getAssignments(courseId).subscribe({
      next: (list) => {
        this.assignments = list;
        this.loadStudentSubmissions();
      },
      error: () => {
        this.errorMsg = 'Failed to load assignments.';
      }
    });
  }

  loadStudentSubmissions() {
    if (!this.loggedInStudent) return;
    this.apiService.getStudentSubmissions(this.loggedInStudent.name, this.loggedInStudent.collegeName).subscribe({
      next: (subs) => {
        this.studentSubmissions = subs;
      }
    });
  }

  getSubmissionForAssignment(assignmentId: string): AssignmentSubmission | null {
    return this.studentSubmissions.find(s => s.assignment && s.assignment.id === assignmentId) || null;
  }

  isDeadlinePassed(deadlineStr: string): boolean {
    const deadline = new Date(deadlineStr);
    return new Date() > deadline;
  }

  selectAssignmentForUpload(assignment: Assignment) {
    if (this.isDeadlinePassed(assignment.deadline)) {
      alert('This assignment has closed.');
      return;
    }
    this.selectedAssignment = assignment;
    this.assignStep = 'upload';
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  onFileDropped(event: any) {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      const file: File = event.dataTransfer.files[0];
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  submitAssignment() {
    this.errorMsg = '';
    if (!this.loggedInStudent || !this.selectedFile || !this.activeCourse || !this.selectedAssignment) {
      this.errorMsg = 'Please select a file to submit.';
      return;
    }

    const formData = new FormData();
    formData.append('courseId', this.activeCourse.id.toString());
    formData.append('assignmentId', this.selectedAssignment.id.toString());
    formData.append('studentName', this.loggedInStudent.name);
    formData.append('collegeName', this.loggedInStudent.collegeName);
    formData.append('file', this.selectedFile);

    this.apiService.submitAssignment(formData).subscribe({
      next: () => {
        this.successMsg = 'Your homework assignment has been uploaded successfully.';
        this.assignStep = 'success';
        this.loadStudentSubmissions();
      },
      error: () => {
        this.errorMsg = 'Failed to upload homework file.';
      }
    });
  }

  // ==================== RESULTS MODULE ====================

  loadHistoricalResults() {
    if (!this.loggedInStudent) return;
    this.apiService.getQuizSubmissions().subscribe({
      next: (list) => {
        this.allSubmissions = list.filter(sub => 
          sub.student?.id === this.loggedInStudent?.id || 
          sub.studentName === this.loggedInStudent?.name
        );
      }
    });
  }

  viewDetailedSubmissionBreakdown(sub: QuizSubmission) {
    this.apiService.getQuizSubmissionDetail(sub.id).subscribe({
      next: (res) => {
        this.detailedSubmission = res;
      },
      error: () => {
        this.errorMsg = 'Failed to load detailed answers breakdown.';
      }
    });
  }

  getParsedPreview(text: string): SafeHtml {
    if (!text) return '';
    let parsed = text;

    // Convert relative backend uploads paths to absolute URLs
    parsed = parsed.replace(/\/uploads\//g, 'http://localhost:3000/uploads/');

    const katex = (window as any).katex;
    const hljs = (window as any).hljs;

    parsed = parsed.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      try {
        return `<div class="katex-display-formula">${katex ? katex.renderToString(formula, { displayMode: true }) : formula}</div>`;
      } catch (e) {
        return `<div class="katex-error">${formula}</div>`;
      }
    });

    parsed = parsed.replace(/\$([^$]+)\$/g, (match, formula) => {
      try {
        return `<span class="katex-inline-formula">${katex ? katex.renderToString(formula, { displayMode: false }) : formula}</span>`;
      } catch (e) {
        return `<span class="katex-error">${formula}</span>`;
      }
    });

    parsed = parsed.replace(/```(\w*)\n([\s\S]+?)```/g, (match, lang, code) => {
      if (hljs) {
        const highlighted = lang ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value;
        return `<pre><code class="hljs ${lang}">${highlighted}</code></pre>`;
      }
      return `<pre><code>${code}</code></pre>`;
    });

    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
    parsed = parsed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; border: 1px solid var(--glass-border); margin:0.5rem 0;" />');
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent-color);">$1</a>');
    parsed = parsed.replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(parsed);
  }

  trackById(index: number, item: any): any {
    return item?.id || index;
  }
}

