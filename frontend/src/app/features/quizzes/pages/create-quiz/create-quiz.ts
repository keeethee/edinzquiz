import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../services/api.service';
import { QuizFormComponent } from '../../components/quiz-form/quiz-form';
import { QuizSettingsComponent } from '../../components/quiz-settings/quiz-settings';

@Component({
  selector: 'app-create-quiz',
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
  ],
  templateUrl: './create-quiz.html',
  styleUrls: ['./create-quiz.scss']
})
export class CreateQuizComponent implements OnInit {
  quizForm!: FormGroup;
  courseId = signal<string>('');
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
    this.route.queryParams.subscribe((params) => {
      const cId = params['courseId'];
      if (!cId) {
        alert('Course Context is required to create a quiz.');
        this.router.navigate(['/admin']);
        return;
      }
      this.courseId.set(cId);
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

  onSubmit() {
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const payload = {
      ...this.quizForm.value,
      courseId: this.courseId()
    };

    this.apiService.createQuiz(payload).subscribe({
      next: (quiz) => {
        this.isSaving.set(false);
        // After creating basic metadata, redirect to edit to assign questions
        this.router.navigate(['/admin/quizzes/edit', quiz.id]);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Error occurred while creating quiz.');
      }
    });
  }
}
