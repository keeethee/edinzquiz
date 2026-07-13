import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Course, Quiz, Question, Option, QuizSubmission, AssignmentSubmission, Assignment } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subscription, interval } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, DragDropModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  activeTab: 'courses' | 'quizzes' | 'assignments' | 'quiz-sub' | 'assign-sub' = 'courses';
  String = String;

  // Shared state
  courses: Course[] = [];
  selectedCourseId: number | null = null;
  errorMsg: string = '';
  successMsg: string = '';

  // --- Courses Tab State ---
  newCourseIdCode: string = '';
  newCourseName: string = '';
  newCourseDuration: string = '';
  newCourseStatus: string = 'Active';
  editingCourse: Course | null = null;

  // --- Quizzes Tab State ---
  quizzes: Quiz[] = [];
  selectedQuizId: number | null = null;
  selectedQuiz: Quiz | null = null;

  // Pagination & Filtering state
  quizSearchText: string = '';
  quizFilterCategory: number | null = null;
  quizFilterDifficulty: string = '';
  quizFilterStatus: string = '';
  quizCurrentPage: number = 1;
  quizPageSize: number = 5;

  // --- Quiz Editor State ---
  isQuizEditorOpen: boolean = false;
  quizForm!: FormGroup;
  activeQuestionIndex: number | null = null;
  categories: any[] = [];
  validationErrors: string[] = [];

  // Autosave & Loading variables
  autosaveSub?: Subscription;
  lastAutosavedTime: string = '';
  isAutosaving: boolean = false;
  isSaving: boolean = false;
  isSavingDraft: boolean = false;
  isPublishing: boolean = false;

  // Leaderboard & Analytics Modals
  showLeaderboardModal: boolean = false;
  leaderboardSubmissions: QuizSubmission[] = [];
  leaderboardQuizTitle: string = '';

  showAnalyticsModal: boolean = false;
  analyticsQuizTitle: string = '';
  analyticsData: any = null;

  publishedAssignments: Assignment[] = [];
  newAssignTitle: string = '';
  newAssignDesc: string = '';
  newAssignDeadline: string = '';
  showAssignmentEditModal: boolean = false;
  editingAssignment: Assignment | null = null;
  editAssignTitle: string = '';
  editAssignDesc: string = '';
  editAssignDeadline: string = '';

  // --- Quiz Submissions Tab State ---
  quizSubmissions: QuizSubmission[] = [];
  detailedSubmission: QuizSubmission | null = null;
  
  // Subjective grading helper
  subjectiveGrades: Record<number, number> = {};

  // --- Assignment Submissions Tab State ---
  assignSubmissions: AssignmentSubmission[] = [];
  selectedSubToGrade: AssignmentSubmission | null = null;
  gradeMarks: number = 0;
  gradeFeedback: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.stopAutosaveLoop();
  }

  canDeactivate(): boolean {
    if (this.isQuizEditorOpen && this.quizForm && this.quizForm.dirty) {
      return confirm('You have unsaved changes in the Quiz Editor. Are you sure you want to discard them?');
    }
    return true;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  switchTab(tab: 'courses' | 'quizzes' | 'assignments' | 'quiz-sub' | 'assign-sub') {
    if (this.isQuizEditorOpen) {
      if (!this.canDeactivate()) return;
      this.stopAutosaveLoop();
      this.isQuizEditorOpen = false;
    }

    this.activeTab = tab;
    this.errorMsg = '';
    this.successMsg = '';
    this.editingCourse = null;
    this.selectedQuiz = null;
    this.selectedSubToGrade = null;
    this.detailedSubmission = null;
    this.closeModals();

    if (tab === 'courses') {
      this.loadCourses();
    } else if (tab === 'quizzes') {
      this.loadCourses();
      if (this.selectedCourseId) {
        this.loadQuizzes(this.selectedCourseId);
      }
    } else if (tab === 'assignments') {
      this.loadCourses();
      if (this.selectedCourseId) {
        this.loadAssignments(this.selectedCourseId);
      }
    } else if (tab === 'quiz-sub') {
      this.loadQuizSubmissions();
    } else if (tab === 'assign-sub') {
      this.loadAssignmentSubmissions();
    }
  }

  closeModals() {
    this.showLeaderboardModal = false;
    this.showAnalyticsModal = false;
    this.leaderboardSubmissions = [];
    this.analyticsData = null;
  }

  // ==================== COURSES ====================

  loadCourses() {
    this.apiService.getCourses().subscribe({
      next: (list) => {
        this.courses = list;
        if (!this.selectedCourseId && list.length > 0) {
          this.selectedCourseId = list[0].id;
          if (this.activeTab === 'quizzes') this.loadQuizzes(list[0].id);
          if (this.activeTab === 'assignments') this.loadAssignments(list[0].id);
        }
      },
      error: () => {
        this.errorMsg = 'Failed to load courses. Please login again.';
      }
    });
  }

  createCourse() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.newCourseIdCode.trim() || !this.newCourseName.trim()) {
      this.errorMsg = 'Course ID code and Course Name are required.';
      return;
    }

    this.apiService.createCourse(
      this.newCourseIdCode.trim(),
      this.newCourseName.trim(),
      this.newCourseDuration,
      this.newCourseStatus
    ).subscribe({
      next: (c) => {
        this.successMsg = `Course "${c.courseName}" created.`;
        this.newCourseIdCode = '';
        this.newCourseName = '';
        this.newCourseDuration = '';
        this.newCourseStatus = 'Active';
        this.loadCourses();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to create course.';
      }
    });
  }

  editCourse(c: Course) {
    this.editingCourse = { ...c };
  }

  saveCourseEdit() {
    if (!this.editingCourse) return;
    this.errorMsg = '';
    this.successMsg = '';

    this.apiService.updateCourse(
      this.editingCourse.id,
      this.editingCourse.courseId,
      this.editingCourse.courseName,
      this.editingCourse.duration,
      this.editingCourse.status
    ).subscribe({
      next: () => {
        this.successMsg = 'Course details updated successfully.';
        this.editingCourse = null;
        this.loadCourses();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to edit course.';
      }
    });
  }

  deleteCourse(id: number) {
    if (!confirm('Are you sure you want to delete this course? This deletes quizzes, questions and submissions.')) {
      return;
    }
    this.apiService.deleteCourse(id).subscribe({
      next: () => {
        this.successMsg = 'Course deleted.';
        if (this.selectedCourseId === id) this.selectedCourseId = null;
        this.loadCourses();
      },
      error: () => {
        this.errorMsg = 'Failed to delete course.';
      }
    });
  }

  // ==================== QUIZZES ====================

  onCourseChangeForQuiz() {
    if (this.selectedCourseId) {
      this.loadQuizzes(this.selectedCourseId);
      this.selectedQuiz = null;
      this.quizCurrentPage = 1;
    }
  }

  loadQuizzes(courseId: number) {
    this.apiService.getQuizzes(courseId).subscribe({
      next: (list) => {
        this.quizzes = list;
      },
      error: () => {
        this.errorMsg = 'Failed to load quizzes.';
      }
    });
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: () => {
        console.error('Failed to load categories');
      }
    });
  }

  deleteQuiz(id: number) {
    if (!confirm('Delete this quiz and all its questions/submissions?')) return;
    this.apiService.deleteQuiz(id).subscribe({
      next: () => {
        this.successMsg = 'Quiz deleted.';
        this.loadQuizzes(this.selectedCourseId!);
      },
      error: () => {
        this.errorMsg = 'Failed to delete quiz.';
      }
    });
  }

  duplicateQuiz(quiz: Quiz) {
    if (!confirm(`Are you sure you want to duplicate "${quiz.quizTitle}"?`)) return;
    this.isSaving = true;
    this.apiService.duplicateQuiz(quiz.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMsg = 'Quiz duplicated successfully as Draft.';
        this.loadQuizzes(this.selectedCourseId!);
      },
      error: () => {
        this.isSaving = false;
        this.errorMsg = 'Failed to duplicate quiz.';
      }
    });
  }

  // Pagination & Filtering state methods
  get filteredQuizzes(): Quiz[] {
    let list = this.quizzes || [];
    
    if (this.quizSearchText.trim()) {
      const txt = this.quizSearchText.toLowerCase();
      list = list.filter(q => q.quizTitle.toLowerCase().includes(txt) || (q.description && q.description.toLowerCase().includes(txt)));
    }
    
    if (this.quizFilterCategory && String(this.quizFilterCategory) !== 'null') {
      list = list.filter(q => q.category && q.category.id === Number(this.quizFilterCategory));
    }
    
    if (this.quizFilterDifficulty) {
      list = list.filter(q => q.difficulty === this.quizFilterDifficulty);
    }
    
    if (this.quizFilterStatus) {
      list = list.filter(q => q.status === this.quizFilterStatus);
    }
    
    return list;
  }

  get paginatedQuizzes(): Quiz[] {
    const list = this.filteredQuizzes;
    const startIndex = (this.quizCurrentPage - 1) * this.quizPageSize;
    return list.slice(startIndex, startIndex + this.quizPageSize);
  }

  get totalQuizPages(): number {
    return Math.ceil(this.filteredQuizzes.length / this.quizPageSize) || 1;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalQuizPages) {
      this.quizCurrentPage = page;
    }
  }

  // ==================== QUIZ EDITOR (REACTIVE FORMS) ====================

  get questionsFormArray(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptionsFormArray(questionIndex: number): FormArray {
    return this.questionsFormArray.at(questionIndex).get('options') as FormArray;
  }

  initQuizForm(quiz?: Quiz) {
    const questionsArray: FormArray = this.fb.array([]);
    
    if (quiz && quiz.questions) {
      quiz.questions.forEach(q => {
        const optionsArray: FormArray = this.fb.array([]);
        if (q.options) {
          q.options.forEach(o => {
            optionsArray.push(this.fb.group({
              id: [o.id],
              optionText: [o.optionText, Validators.required],
              isCorrect: [o.isCorrect || false]
            }));
          });
        }
        
        questionsArray.push(this.fb.group({
          id: [q.id],
          questionText: [q.questionText, Validators.required],
          questionType: [q.questionType],
          mark: [q.mark || 1, [Validators.required, Validators.min(1)]],
          explanation: [q.explanation || ''],
          caseSensitive: [q.caseSensitive || false],
          sampleAnswer: [q.sampleAnswer || ''],
          correctAnswerText: [q.correctAnswerText || ''],
          options: optionsArray
        }));
      });
    }

    let start = '';
    let end = '';
    if (quiz) {
      start = quiz.startTime.slice(0, 16);
      end = quiz.endTime.slice(0, 16);
    } else {
      const now = new Date();
      start = now.toISOString().slice(0, 16);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      end = tomorrow.toISOString().slice(0, 16);
    }

    const totalMarks = quiz?.questions?.reduce((sum: number, q: any) => sum + (q.mark || 0), 0) || 0;
    let passingMarksVal = quiz?.passingMarks ?? 0;
    if (quiz && passingMarksVal > totalMarks) {
      passingMarksVal = Math.ceil(totalMarks * 0.40);
    }

    this.quizForm = this.fb.group({
      id: [quiz?.id || null],
      quizTitle: [quiz?.quizTitle || '', Validators.required],
      description: [quiz?.description || ''],
      difficulty: [quiz?.difficulty || 'Medium', Validators.required],
      categoryId: [quiz?.category?.id || ''],
      startTime: [start, Validators.required],
      endTime: [end, Validators.required],
      duration: [quiz?.duration || 60, [Validators.required, Validators.min(1)]],
      passingMarks: [passingMarksVal, [Validators.required, Validators.min(0)]],
      maxAttempts: [quiz?.settings?.maxAttempts || 1, [Validators.required, Validators.min(1)]],
      shuffleQuestions: [quiz?.shuffleQuestions || false],
      shuffleOptions: [quiz?.shuffleOptions || false],
      negativeMarkingEnabled: [quiz?.negativeMarkingEnabled || false],
      negativeMarkingValue: [quiz?.negativeMarkingValue || 0.25],
      showResultsImmediately: [quiz?.settings?.showResultsImmediately ?? true],
      status: [quiz?.status || 'Draft'],
      questions: questionsArray
    });

    this.quizForm.get('startTime')?.valueChanges.subscribe(() => this.autoCalculateDuration());
    this.quizForm.get('endTime')?.valueChanges.subscribe(() => this.autoCalculateDuration());

    if (questionsArray.length > 0) {
      this.activeQuestionIndex = 0;
    }
  }

  autoCalculateDuration() {
    if (!this.quizForm) return;
    const startVal = this.quizForm.get('startTime')?.value;
    const endVal = this.quizForm.get('endTime')?.value;
    if (startVal && endVal) {
      const startTime = new Date(startVal);
      const endTime = new Date(endVal);
      const diffMs = endTime.getTime() - startTime.getTime();
      if (diffMs > 0) {
        const diffMins = Math.floor(diffMs / 60000);
        this.quizForm.get('duration')?.setValue(diffMins, { emitEvent: false });
      }
    }
  }

  openQuizEditor(quiz?: Quiz) {
    this.isQuizEditorOpen = true;
    this.validationErrors = [];
    this.activeQuestionIndex = null;
    this.lastAutosavedTime = '';
    
    if (quiz) {
      this.isSaving = true;
      this.apiService.getQuiz(quiz.id).subscribe({
        next: (fullQuiz) => {
          this.isSaving = false;
          this.initQuizForm(fullQuiz);
          this.startAutosaveLoop();
        },
        error: () => {
          this.isSaving = false;
          this.errorMsg = 'Failed to load quiz details.';
        }
      });
    } else {
      this.initQuizForm();
      this.startAutosaveLoop();
    }
  }

  closeQuizEditor() {
    if (this.quizForm && this.quizForm.dirty) {
      if (!confirm('You have unsaved changes. Close anyway?')) {
        return;
      }
    }
    this.stopAutosaveLoop();
    this.isQuizEditorOpen = false;
    this.activeQuestionIndex = null;
    if (this.selectedCourseId) {
      this.loadQuizzes(this.selectedCourseId);
    }
  }

  startAutosaveLoop() {
    this.stopAutosaveLoop();
    this.autosaveSub = interval(30000).subscribe(() => {
      this.triggerAutosave();
    });
  }

  stopAutosaveLoop() {
    if (this.autosaveSub) {
      this.autosaveSub.unsubscribe();
      this.autosaveSub = undefined;
    }
  }

  triggerAutosave() {
    if (this.quizForm && this.quizForm.dirty && !this.isAutosaving && !this.isSaving) {
      this.isAutosaving = true;
      const quizId = this.quizForm.get('id')?.value;
      const payload = this.prepareSavePayload();
      
      if (!quizId) {
        this.apiService.createQuiz(
          this.selectedCourseId!,
          payload.quizTitle,
          payload.startTime,
          payload.endTime,
          payload.totalMarks,
          payload.duration,
          payload.passingMarks,
          payload.negativeMarkingEnabled,
          payload.negativeMarkingValue,
          payload.shuffleQuestions,
          payload.shuffleOptions,
          payload.description,
          payload.difficulty,
          payload.categoryId || undefined,
          payload.settings
        ).subscribe({
          next: (savedQuiz) => {
            this.quizForm.get('id')?.setValue(savedQuiz.id);
            this.apiService.updateQuiz(savedQuiz.id, { questions: payload.questions }).subscribe({
              next: (updatedQuiz) => {
                this.isAutosaving = false;
                this.quizForm.markAsPristine();
                this.updateFormQuestionIds(updatedQuiz);
                this.setAutosaveTimestamp();
              },
              error: () => { this.isAutosaving = false; }
            });
          },
          error: () => { this.isAutosaving = false; }
        });
      } else {
        this.apiService.updateQuiz(quizId, payload).subscribe({
          next: (updatedQuiz) => {
            this.isAutosaving = false;
            this.quizForm.markAsPristine();
            this.updateFormQuestionIds(updatedQuiz);
            this.setAutosaveTimestamp();
          },
          error: () => { this.isAutosaving = false; }
        });
      }
    }
  }

  setAutosaveTimestamp() {
    const now = new Date();
    this.lastAutosavedTime = `Draft autosaved at ${now.toTimeString().split(' ')[0]}`;
  }

  updateFormQuestionIds(updatedQuiz: Quiz) {
    const formQuestions = this.quizForm.get('questions') as FormArray;
    if (updatedQuiz.questions && formQuestions.length === updatedQuiz.questions.length) {
      updatedQuiz.questions.forEach((q, idx) => {
        const fq = formQuestions.at(idx);
        fq.get('id')?.setValue(q.id);
        
        const fOpts = fq.get('options') as FormArray;
        if (q.options && fOpts.length === q.options.length) {
          q.options.forEach((o, oIdx) => {
            fOpts.at(oIdx).get('id')?.setValue(o.id);
          });
        }
      });
    }
  }

  prepareSavePayload() {
    const val = this.quizForm.value;
    const questions = val.questions || [];
    const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.mark || 0), 0);
    const passingMarks = val.passingMarks || 0;
    const passingPercentage = totalMarks > 0 ? Math.round((passingMarks / totalMarks) * 100) : 40;

    return {
      quizTitle: val.quizTitle,
      description: val.description,
      difficulty: val.difficulty,
      startTime: val.startTime,
      endTime: val.endTime,
      status: val.status,
      duration: val.duration,
      totalMarks: totalMarks,
      passingMarks: passingMarks,
      negativeMarkingEnabled: val.negativeMarkingEnabled,
      negativeMarkingValue: val.negativeMarkingValue,
      shuffleQuestions: val.shuffleQuestions,
      shuffleOptions: val.shuffleOptions,
      categoryId: val.categoryId ? Number(val.categoryId) : null,
      settings: {
        maxAttempts: val.maxAttempts,
        passingPercentage: passingPercentage,
        showResultsImmediately: val.showResultsImmediately
      },
      questions: questions.map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        mark: q.mark,
        explanation: q.explanation,
        caseSensitive: q.caseSensitive,
        sampleAnswer: q.sampleAnswer,
        correctAnswerText: q.correctAnswerText,
        options: q.options.map((o: any) => ({
          id: o.id,
          optionText: o.optionText,
          isCorrect: o.isCorrect
        }))
      }))
    };
  }

  saveQuizDraft() {
    if (!this.selectedCourseId) return;
    this.errorMsg = '';
    this.successMsg = '';
    
    if (!this.quizForm.get('quizTitle')?.value?.trim()) {
      this.errorMsg = 'Quiz Title is required to save a draft.';
      return;
    }

    this.isSaving = true;
    this.isSavingDraft = true;
    const quizId = this.quizForm.get('id')?.value;
    const payload = this.prepareSavePayload();
    payload.status = 'Draft';
    this.quizForm.get('status')?.setValue('Draft');

    if (!quizId) {
      this.apiService.createQuiz(
        this.selectedCourseId,
        payload.quizTitle,
        payload.startTime,
        payload.endTime,
        payload.totalMarks,
        payload.duration,
        payload.passingMarks,
        payload.negativeMarkingEnabled,
        payload.negativeMarkingValue,
        payload.shuffleQuestions,
        payload.shuffleOptions,
        payload.description,
        payload.difficulty,
        payload.categoryId || undefined,
        payload.settings
      ).subscribe({
        next: (savedQuiz) => {
          this.apiService.updateQuiz(savedQuiz.id, { questions: payload.questions }).subscribe({
            next: (updatedQuiz) => {
              this.isSaving = false;
              this.isSavingDraft = false;
              this.quizForm.get('id')?.setValue(updatedQuiz.id);
              this.quizForm.markAsPristine();
              this.updateFormQuestionIds(updatedQuiz);
              this.successMsg = 'Quiz Draft saved successfully.';
              this.setAutosaveTimestamp();
            },
            error: (err) => {
              this.isSaving = false;
              this.isSavingDraft = false;
              this.errorMsg = err.error?.message || 'Failed to save draft questions.';
            }
          });
        },
        error: (err) => {
          this.isSaving = false;
          this.isSavingDraft = false;
          this.errorMsg = err.error?.message || 'Failed to save draft.';
        }
      });
    } else {
      this.apiService.updateQuiz(quizId, payload).subscribe({
        next: (updatedQuiz) => {
          this.isSaving = false;
          this.isSavingDraft = false;
          this.quizForm.markAsPristine();
          this.updateFormQuestionIds(updatedQuiz);
          this.successMsg = 'Quiz Draft updated successfully.';
          this.setAutosaveTimestamp();
        },
        error: (err) => {
          this.isSaving = false;
          this.isSavingDraft = false;
          this.errorMsg = err.error?.message || 'Failed to update draft.';
        }
      });
    }
  }

  validateQuizForPublish(): string[] {
    const errors: string[] = [];
    const val = this.quizForm.value;
    const questions = val.questions || [];
    
    if (!val.quizTitle?.trim()) errors.push('Quiz Title is required.');
    if (!val.startTime) errors.push('Start Date & Time is required.');
    if (!val.endTime) errors.push('End Date & Time is required.');
    if (val.startTime && val.endTime && new Date(val.startTime) >= new Date(val.endTime)) {
      errors.push('Start Date & Time must be before End Date & Time.');
    }
    if (val.duration === null || val.duration <= 0) errors.push('Duration must be a positive number.');
    const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.mark || 0), 0);
    if (val.passingMarks === null || val.passingMarks < 0 || val.passingMarks > totalMarks) {
      errors.push(`Passing Score (points) must be between 0 and the total marks (${totalMarks}).`);
    }
    if (questions.length === 0) {
      errors.push('Quiz must contain at least one question.');
    }
    
    questions.forEach((q: any, idx: number) => {
      const qNum = idx + 1;
      if (!q.questionText?.trim()) {
        errors.push(`Question #${qNum} text is required.`);
      }
      if (q.mark === null || q.mark <= 0) {
        errors.push(`Question #${qNum} mark must be a positive number.`);
      }
      
      if (q.questionType === 'MCQ_SINGLE' || q.questionType === 'MCQ_MULTIPLE' || q.questionType === 'MCQ') {
        const opts = q.options || [];
        if (opts.length < 2 || opts.length > 8) {
          errors.push(`Question #${qNum} must have between 2 and 8 options.`);
        }
        
        opts.forEach((o: any, oIdx: number) => {
          if (!o.optionText?.trim()) {
            errors.push(`Question #${qNum} Option ${String.fromCharCode(65 + oIdx)} text is required.`);
          }
        });
        
        const corrects = opts.filter((o: any) => o.isCorrect).length;
        if (corrects === 0) {
          errors.push(`Question #${qNum} must have at least one correct option selected.`);
        }
      } else if (q.questionType === 'TF') {
        const opts = q.options || [];
        const corrects = opts.filter((o: any) => o.isCorrect).length;
        if (corrects === 0) {
          errors.push(`Question #${qNum} must specify if the correct key is True or False.`);
        }
      } else if (q.questionType === 'FILL_BLANK' || q.questionType === 'SHORT_ANSWER' || q.questionType === 'FillBlank') {
        if (!q.correctAnswerText?.trim()) {
          errors.push(`Question #${qNum} must have at least one accepted answer specified.`);
        }
      }
    });
    
    return errors;
  }

  publishQuiz() {
    if (!this.selectedCourseId) return;
    this.errorMsg = '';
    this.successMsg = '';
    this.validationErrors = [];

    const errors = this.validateQuizForPublish();
    if (errors.length > 0) {
      this.validationErrors = errors;
      this.errorMsg = 'Please resolve validation errors before publishing.';
      return;
    }

    this.isSaving = true;
    this.isPublishing = true;
    const quizId = this.quizForm.get('id')?.value;
    const payload = this.prepareSavePayload();
    payload.status = 'Published';
    this.quizForm.get('status')?.setValue('Published');

    if (!quizId) {
      this.apiService.createQuiz(
        this.selectedCourseId,
        payload.quizTitle,
        payload.startTime,
        payload.endTime,
        payload.totalMarks,
        payload.duration,
        payload.passingMarks,
        payload.negativeMarkingEnabled,
        payload.negativeMarkingValue,
        payload.shuffleQuestions,
        payload.shuffleOptions,
        payload.description,
        payload.difficulty,
        payload.categoryId || undefined,
        payload.settings
      ).subscribe({
        next: (savedQuiz) => {
          this.apiService.updateQuiz(savedQuiz.id, { status: 'Published', questions: payload.questions }).subscribe({
            next: (updatedQuiz) => {
              this.isSaving = false;
              this.isPublishing = false;
              this.quizForm.markAsPristine();
              this.successMsg = 'Quiz published successfully!';
              this.isQuizEditorOpen = false;
              this.loadQuizzes(this.selectedCourseId!);
            },
            error: (err) => {
              this.isSaving = false;
              this.isPublishing = false;
              this.errorMsg = err.error?.message || 'Failed to save published questions.';
            }
          });
        },
        error: (err) => {
          this.isSaving = false;
          this.isPublishing = false;
          this.errorMsg = err.error?.message || 'Failed to publish quiz.';
        }
      });
    } else {
      this.apiService.updateQuiz(quizId, payload).subscribe({
        next: (updatedQuiz) => {
          this.isSaving = false;
          this.isPublishing = false;
          this.quizForm.markAsPristine();
          this.successMsg = 'Quiz published successfully!';
          this.isQuizEditorOpen = false;
          this.loadQuizzes(this.selectedCourseId!);
        },
        error: (err) => {
          this.isSaving = false;
          this.isPublishing = false;
          this.errorMsg = err.error?.message || 'Failed to publish quiz.';
        }
      });
    }
  }

  // --- Dynamic Question Modifications ---

  addQuestion(type: string = 'MCQ_SINGLE') {
    const questions = this.questionsFormArray;
    const questionGroup = this.fb.group({
      id: [null],
      questionText: ['', Validators.required],
      questionType: [type],
      mark: [1, [Validators.required, Validators.min(1)]],
      explanation: [''],
      caseSensitive: [false],
      sampleAnswer: [''],
      correctAnswerText: [''],
      options: this.fb.array([]) as FormArray
    });
    
    if (type === 'MCQ_SINGLE' || type === 'MCQ_MULTIPLE') {
      const options = questionGroup.get('options') as FormArray;
      options.push(this.fb.group({ id: [null], optionText: ['', Validators.required], isCorrect: [true] }));
      options.push(this.fb.group({ id: [null], optionText: ['', Validators.required], isCorrect: [false] }));
      options.push(this.fb.group({ id: [null], optionText: ['', Validators.required], isCorrect: [false] }));
      options.push(this.fb.group({ id: [null], optionText: ['', Validators.required], isCorrect: [false] }));
    } else if (type === 'TF') {
      const options = questionGroup.get('options') as FormArray;
      options.push(this.fb.group({ id: [null], optionText: ['True'], isCorrect: [true] }));
      options.push(this.fb.group({ id: [null], optionText: ['False'], isCorrect: [false] }));
    }
    
    questions.push(questionGroup);
    this.activeQuestionIndex = questions.length - 1;
    this.quizForm.markAsDirty();
  }

  duplicateQuestion(index: number) {
    const questions = this.questionsFormArray;
    const orig = questions.at(index) as FormGroup;
    
    const origOptions = orig.get('options') as FormArray;
    const dupOptions: FormArray = this.fb.array([]);
    origOptions.controls.forEach(opt => {
      dupOptions.push(this.fb.group({
        id: [null],
        optionText: [opt.value.optionText, Validators.required],
        isCorrect: [opt.value.isCorrect]
      }));
    });

    const dupQ = this.fb.group({
      id: [null],
      questionText: [`${orig.value.questionText} (Copy)`, Validators.required],
      questionType: [orig.value.questionType],
      mark: [orig.value.mark, [Validators.required, Validators.min(1)]],
      explanation: [orig.value.explanation],
      caseSensitive: [orig.value.caseSensitive],
      sampleAnswer: [orig.value.sampleAnswer],
      correctAnswerText: [orig.value.correctAnswerText],
      options: dupOptions
    });

    questions.insert(index + 1, dupQ);
    this.activeQuestionIndex = index + 1;
    this.quizForm.markAsDirty();
  }

  deleteQuestion(index: number) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const questions = this.questionsFormArray;
    questions.removeAt(index);
    if (this.activeQuestionIndex === index) {
      this.activeQuestionIndex = questions.length > 0 ? 0 : null;
    } else if (this.activeQuestionIndex !== null && this.activeQuestionIndex > index) {
      this.activeQuestionIndex--;
    }
    this.quizForm.markAsDirty();
  }

  onQuestionDropped(event: any) {
    const questions = this.questionsFormArray;
    const from = event.previousIndex;
    const to = event.currentIndex;
    
    const control = questions.at(from);
    questions.removeAt(from);
    questions.insert(to, control);
    
    this.activeQuestionIndex = to;
    this.quizForm.markAsDirty();
  }

  addOption(questionIndex: number) {
    const options = this.getOptionsFormArray(questionIndex);
    if (options.length >= 8) return;
    options.push(this.fb.group({
      id: [null],
      optionText: ['', Validators.required],
      isCorrect: [false]
    }));
    this.quizForm.markAsDirty();
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const options = this.getOptionsFormArray(questionIndex);
    if (options.length <= 2) return;
    options.removeAt(optionIndex);
    this.quizForm.markAsDirty();
  }

  selectSingleCorrectOption(questionIndex: number, optionIndex: number) {
    const options = this.getOptionsFormArray(questionIndex);
    options.controls.forEach((opt, idx) => {
      opt.get('isCorrect')?.setValue(idx === optionIndex);
    });
    this.quizForm.markAsDirty();
  }

  toggleMultipleCorrectOption(questionIndex: number, optionIndex: number) {
    const options = this.getOptionsFormArray(questionIndex);
    const opt = options.at(optionIndex);
    opt.get('isCorrect')?.setValue(!opt.get('isCorrect')?.value);
    this.quizForm.markAsDirty();
  }

  onQuestionFileSelected(event: any, questionIndex: number) {
    const file = event.target.files[0];
    if (!file) return;

    this.isAutosaving = true;
    this.apiService.uploadMedia(file).subscribe({
      next: (res) => {
        this.isAutosaving = false;
        const question = this.questionsFormArray.at(questionIndex);
        const currentText = question.get('questionText')?.value || '';
        let mediaTag = '';
        if (file.type.startsWith('image/')) {
          mediaTag = `\n![Image](${res.url})`;
        } else if (file.type.startsWith('video/')) {
          mediaTag = `\n<video controls src="${res.url}" style="max-width:100%; height:auto;"></video>`;
        } else if (file.type.startsWith('audio/')) {
          mediaTag = `\n<audio controls src="${res.url}"></audio>`;
        } else {
          mediaTag = `\n[Download Attachment](${res.url})`;
        }
        question.get('questionText')?.setValue(currentText + mediaTag);
        this.quizForm.markAsDirty();
        this.successMsg = 'Media file uploaded and reference tag appended.';
      },
      error: () => {
        this.isAutosaving = false;
        this.errorMsg = 'Failed to upload media file.';
      }
    });
  }

  isOptionSelectedInSubmission(sa: any, optId: number): boolean {
    if (!sa) return false;
    if (sa.selectedOption && sa.selectedOption.id === optId) return true;
    if (sa.typedAnswerText) {
      try {
        const ids = JSON.parse(sa.typedAnswerText);
        if (Array.isArray(ids)) {
          return ids.includes(optId);
        }
      } catch (e) {
        return sa.typedAnswerText.split(',').map(Number).includes(optId);
      }
    }
    return false;
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

  get editorTotalMarks(): number {
    if (!this.quizForm) return 0;
    const questions = this.quizForm.get('questions')?.value || [];
    return questions.reduce((sum: number, q: any) => sum + (q.mark || 0), 0);
  }

  getSelectedCourseName(): string {
    if (!this.selectedCourseId) return 'No Course Selected';
    const course = this.courses.find(c => c.id === Number(this.selectedCourseId));
    return course ? `${course.courseId} - ${course.courseName}` : 'Unknown Course';
  }

  // ==================== LEADERBOARD & ANALYTICS ====================
  
  openLeaderboard(quiz: Quiz) {
    this.leaderboardQuizTitle = quiz.quizTitle;
    this.apiService.getLeaderboard(quiz.id).subscribe({
      next: (list) => {
        this.leaderboardSubmissions = list;
        this.showLeaderboardModal = true;
      },
      error: () => {
        alert('Failed to load leaderboard data.');
      }
    });
  }

  openAnalytics(quiz: Quiz) {
    this.analyticsQuizTitle = quiz.quizTitle;
    this.apiService.getAnalytics(quiz.id).subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.showAnalyticsModal = true;
      },
      error: () => {
        alert('Failed to load analytics.');
      }
    });
  }

  // ==================== ASSIGNMENTS ====================

  onCourseChangeForAssignment() {
    if (this.selectedCourseId) {
      this.loadAssignments(this.selectedCourseId);
    }
  }

  loadAssignments(courseId: number) {
    this.apiService.getAssignments(courseId).subscribe({
      next: (list) => {
        this.publishedAssignments = list;
      },
      error: () => {
        this.errorMsg = 'Failed to load assignments.';
      }
    });
  }

  createAssignment() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.selectedCourseId) return;
    if (!this.newAssignTitle.trim() || !this.newAssignDeadline) {
      this.errorMsg = 'Title and deadline are required.';
      return;
    }

    this.apiService.createAssignment(
      this.selectedCourseId,
      this.newAssignTitle,
      this.newAssignDesc,
      this.newAssignDeadline
    ).subscribe({
      next: () => {
        this.successMsg = 'Assignment published.';
        this.newAssignTitle = '';
        this.newAssignDesc = '';
        this.newAssignDeadline = '';
        this.loadAssignments(this.selectedCourseId!);
      },
      error: () => {
        this.errorMsg = 'Failed to publish assignment.';
      }
    });
  }

  deleteAssignment(id: number) {
    if (!confirm('Delete this assignment?')) return;
    this.apiService.deleteAssignment(id).subscribe({
      next: () => {
        this.successMsg = 'Assignment deleted.';
        this.loadAssignments(this.selectedCourseId!);
      },
      error: () => {
        this.errorMsg = 'Failed to delete assignment.';
      }
    });
  }

  openEditAssignmentModal(a: Assignment) {
    this.editingAssignment = a;
    this.editAssignTitle = a.title;
    this.editAssignDesc = a.description || '';
    if (a.deadline) {
      const date = new Date(a.deadline);
      const pad = (num: number) => num.toString().padStart(2, '0');
      this.editAssignDeadline = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } else {
      this.editAssignDeadline = '';
    }
    this.showAssignmentEditModal = true;
  }

  saveEditedAssignment() {
    if (!this.editingAssignment) return;
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.editAssignTitle.trim() || !this.editAssignDeadline) {
      this.errorMsg = 'Title and deadline are required.';
      return;
    }

    this.apiService.updateAssignment(this.editingAssignment.id, {
      title: this.editAssignTitle,
      description: this.editAssignDesc,
      deadline: this.editAssignDeadline
    }).subscribe({
      next: () => {
        this.successMsg = 'Assignment updated successfully.';
        this.showAssignmentEditModal = false;
        this.editingAssignment = null;
        if (this.selectedCourseId) {
          this.loadAssignments(this.selectedCourseId);
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to update assignment.';
      }
    });
  }

  // ==================== SUBMISSIONS & GRADING ====================

  loadQuizSubmissions() {
    this.apiService.getQuizSubmissions().subscribe({
      next: (list) => {
        this.quizSubmissions = list;
      },
      error: () => {
        this.errorMsg = 'Failed to load quiz submissions.';
      }
    });
  }

  viewQuizSubmissionDetail(id: number) {
    this.apiService.getQuizSubmissionDetail(id).subscribe({
      next: (res) => {
        this.detailedSubmission = res;
        this.subjectiveGrades = {};
        
        res.studentAnswers?.forEach(sa => {
          if (sa.question.questionType === 'Subjective' || sa.question.questionType === 'ESSAY') {
            this.subjectiveGrades[sa.question.id] = sa.awardedMarks !== null ? sa.awardedMarks : 0;
          }
        });
      },
      error: () => {
        this.errorMsg = 'Failed to load submission detail.';
      }
    });
  }

  saveSubjectiveGrades() {
    if (!this.detailedSubmission) return;
    this.errorMsg = '';
    this.successMsg = '';

    const evaluations = Object.keys(this.subjectiveGrades).map(qId => ({
      questionId: Number(qId),
      marks: Number(this.subjectiveGrades[Number(qId)])
    }));

    this.apiService.evaluateSubmission(this.detailedSubmission.id, evaluations).subscribe({
      next: (updated) => {
        this.successMsg = `Evaluations saved for ${updated.studentName}.`;
        this.viewQuizSubmissionDetail(updated.id);
        this.loadQuizSubmissions();
      },
      error: () => {
        this.errorMsg = 'Failed to save subjective grades.';
      }
    });
  }

  exportSubmissions() {
    this.apiService.exportQuizSubmissions().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_results_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      error: () => {
        this.errorMsg = 'Failed to export results.';
      }
    });
  }

  loadAssignmentSubmissions() {
    this.apiService.getAssignmentSubmissions().subscribe({
      next: (list) => {
        this.assignSubmissions = list;
      },
      error: () => {
        this.errorMsg = 'Failed to load homework uploads.';
      }
    });
  }

  downloadHomework(sub: AssignmentSubmission) {
    this.apiService.downloadSubmissionFile(sub.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = sub.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      error: () => {
        this.errorMsg = 'Failed to download homework file.';
      }
    });
  }

  selectSubmissionToGrade(sub: AssignmentSubmission) {
    this.selectedSubToGrade = sub;
    this.gradeMarks = sub.marks || 0;
    this.gradeFeedback = sub.feedback || '';
  }

  submitGrade() {
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.selectedSubToGrade) return;

    this.apiService.gradeAssignmentSubmission(
      this.selectedSubToGrade.id,
      this.gradeMarks,
      this.gradeFeedback
    ).subscribe({
      next: (updated) => {
        this.successMsg = `Homework graded for ${updated.studentName}.`;
        this.selectedSubToGrade = null;
        this.loadAssignmentSubmissions();
      },
      error: () => {
        this.errorMsg = 'Failed to save grade details.';
      }
    });
  }
}

export interface CanComponentDeactivate {
  canDeactivate: () => boolean;
}
