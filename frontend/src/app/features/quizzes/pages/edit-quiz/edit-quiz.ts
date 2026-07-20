import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, Quiz } from '../../../../services/api.service';
import { QuizFormComponent } from '../../components/quiz-form/quiz-form';
import { QuizSettingsComponent } from '../../components/quiz-settings/quiz-settings';
import { QuestionSelectorComponent } from '../../components/question-selector/question-selector';
import { SelectedQuestionsComponent } from '../../components/selected-questions/selected-questions';

@Component({
  selector: 'app-edit-quiz',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    QuizFormComponent,
    QuizSettingsComponent,
    QuestionSelectorComponent,
    SelectedQuestionsComponent,
  ],
  templateUrl: './edit-quiz.html',
  styleUrls: ['./edit-quiz.scss']
})
export class EditQuizComponent implements OnInit {
  quizForm!: FormGroup;
  quizId = signal<string>('');
  quiz = signal<Quiz | null>(null);
  assignedQuestions = signal<any[]>([]);
  linkedQuestionIds = signal<string[]>([]);
  
  isSaving = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.quizId.set(id);
        this.loadQuiz(id);
      }
    });
  }

  initForm() {
    this.quizForm = this.fb.group({
      quizTitle: ['', Validators.required],
      categoryId: [null],
      difficulty: ['Medium', Validators.required],
      description: [''],
      instructions: [''],
      timerMode: ['No Timer', Validators.required],
      duration: [60, [Validators.required, Validators.min(1)]],
      passingMarks: [40, [Validators.required, Validators.min(0)]],
      maxAttempts: [1, [Validators.required, Validators.min(1)]],
      shuffleQuestions: [false],
      shuffleOptions: [false],
      autoSubmit: [false],
      showResult: [false],
    });
  }

  loadQuiz(id: string) {
    this.apiService.getQuizDetail(id).subscribe({
      next: (quiz) => {
        this.quiz.set(quiz);
        this.quizForm.patchValue({
          quizTitle: quiz.quizTitle,
          categoryId: quiz.category?.id || null,
          difficulty: quiz.difficulty || 'Medium',
          description: quiz.description || '',
          instructions: quiz.instructions || '',
          timerMode: quiz.timerMode || 'No Timer',
          duration: quiz.duration,
          passingMarks: quiz.passingMarks,
          maxAttempts: quiz.maxAttempts,
          shuffleQuestions: quiz.shuffleQuestions,
          shuffleOptions: quiz.shuffleOptions,
          autoSubmit: quiz.autoSubmit,
          showResult: quiz.showResult,
        });

        const questionsList = quiz.questions || [];
        this.assignedQuestions.set(questionsList);
        this.linkedQuestionIds.set(questionsList.map((q: any) => q.questionId));
      }
    });
  }

  onSubmit() {
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.apiService.updateQuiz(this.quizId(), this.quizForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert('Quiz settings updated successfully.');
        this.loadQuiz(this.quizId());
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to update quiz settings.');
      }
    });
  }

  // Question link handlers
  addQuestions(questionIds: string[]) {
    this.apiService.addQuestionsToQuiz(this.quizId(), questionIds, 1).subscribe({
      next: () => {
        this.loadQuiz(this.quizId());
      }
    });
  }

  removeQuestion(questionId: string) {
    this.apiService.removeQuestionFromQuiz(this.quizId(), questionId).subscribe({
      next: () => {
        this.loadQuiz(this.quizId());
      }
    });
  }

  reorderQuestions(newOrderedQuestions: any[]) {
    const ids = newOrderedQuestions.map((q) => q.questionId);
    this.apiService.reorderQuestions(this.quizId(), ids).subscribe({
      next: () => {
        this.loadQuiz(this.quizId());
      }
    });
  }

  updateQuestionMarks(event: { index: number; marks: number }) {
    const q = this.assignedQuestions()[event.index];
    this.apiService.updateQuizQuestionMarks(this.quizId(), q.questionId, event.marks).subscribe({
      next: () => {
        this.loadQuiz(this.quizId());
      }
    });
  }
}
