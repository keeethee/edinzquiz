import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-quiz-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  template: `
    <div [formGroup]="parentForm" class="quiz-settings-form">
      <div class="grid-3">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Timer Mode</mat-label>
          <mat-select formControlName="timerMode">
            <mat-option value="No Timer">No Timer</mat-option>
            <mat-option value="Quiz Timer">Quiz Timer</mat-option>
            <mat-option value="Question Timer">Question Timer</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Duration (Minutes / Seconds)</mat-label>
          <input matInput type="number" formControlName="duration" min="1" required />
          <mat-error *ngIf="parentForm.get('duration')?.hasError('required')">
            Duration is required.
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Passing Marks (points)</mat-label>
          <input matInput type="number" formControlName="passingMarks" min="0" required />
        </mat-form-field>
      </div>

      <div class="grid-2">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Max Attempts Limit</mat-label>
          <input matInput type="number" formControlName="maxAttempts" min="1" required />
        </mat-form-field>

        <div class="settings-checkboxes-col">
          <mat-checkbox formControlName="shuffleQuestions">Shuffle Questions list on start</mat-checkbox>
          <mat-checkbox formControlName="shuffleOptions">Shuffle MCQ Options list</mat-checkbox>
          <mat-checkbox formControlName="autoSubmit">Enable Auto-Submit on Timer expire</mat-checkbox>
          <mat-checkbox formControlName="showResult">Show detailed results immediately after submission</mat-checkbox>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quiz-settings-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .full-width {
      width: 100%;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .settings-checkboxes-col {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.25rem;
    }
  `]
})
export class QuizSettingsComponent {
  @Input() parentForm!: FormGroup;
}
