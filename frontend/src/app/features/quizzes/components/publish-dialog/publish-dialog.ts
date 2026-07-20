import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService, Quiz } from '../../../../services/api.service';

@Component({
  selector: 'app-publish-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>📢 Publish Quiz: {{ data.quiz.quizTitle }}</h2>
    <mat-dialog-content>
      <form [formGroup]="publishForm" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;">
        
        <mat-radio-group formControlName="publishMode" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <mat-radio-button value="now">Publish Immediately</mat-radio-button>
          <mat-radio-button value="schedule">Schedule Publish Window</mat-radio-button>
        </mat-radio-group>

        <div *ngIf="publishForm.get('publishMode')?.value === 'schedule'" style="display: flex; flex-direction: column; gap: 0.75rem; border-left: 3px solid var(--primary-color, #3f51b5); padding-left: 1rem; margin-left: 0.5rem; margin-top: 0.5rem;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 550; margin-bottom: 0.25rem;">Start Window Date & Time</label>
            <input type="datetime-local" class="neo-datetime-input" formControlName="publishAt" />
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 550; margin-bottom: 0.25rem;">End Window Date & Time</label>
            <input type="datetime-local" class="neo-datetime-input" formControlName="expireAt" />
          </div>
        </div>

        <div *ngIf="errorMessage()" style="color: #ef4444; font-size: 0.85rem; font-weight: 550; margin-top: 0.5rem;">
          ⚠️ {{ errorMessage() }}
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="publishForm.invalid || isSaving()" (click)="submit()">
        {{ isSaving() ? 'Publishing...' : 'Confirm Publish' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .neo-datetime-input {
      width: 100%;
      padding: 0.6rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
    }
    .neo-datetime-input:focus {
      border-color: #3f51b5;
    }
  `]
})
export class PublishDialogComponent {
  publishForm: FormGroup;
  isSaving = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialogRef: MatDialogRef<PublishDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { quiz: Quiz }
  ) {
    this.publishForm = this.fb.group({
      publishMode: ['now', Validators.required],
      publishAt: [null],
      expireAt: [null]
    });

    // Dynamic validation when publishMode changes
    this.publishForm.get('publishMode')?.valueChanges.subscribe((mode) => {
      const startControl = this.publishForm.get('publishAt');
      const endControl = this.publishForm.get('expireAt');
      if (mode === 'schedule') {
        startControl?.setValidators(Validators.required);
        endControl?.setValidators(Validators.required);
      } else {
        startControl?.clearValidators();
        endControl?.clearValidators();
      }
      startControl?.updateValueAndValidity();
      endControl?.updateValueAndValidity();
    });
  }

  submit() {
    this.isSaving.set(true);
    this.errorMessage.set('');

    const mode = this.publishForm.value.publishMode;
    const publishAt = this.publishForm.value.publishAt;
    const expireAt = this.publishForm.value.expireAt;

    if (mode === 'schedule') {
      const start = new Date(publishAt);
      const end = new Date(expireAt);
      if (start >= end) {
        this.errorMessage.set('Start time must be before end time.');
        this.isSaving.set(false);
        return;
      }
    }

    // Call update to save times, then publish
    const payload = mode === 'schedule' ? { publishAt, expireAt } : { publishAt: null, expireAt: null };

    this.apiService.updateQuiz(this.data.quiz.id, payload).subscribe({
      next: () => {
        this.apiService.publishQuiz(this.data.quiz.id).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.errorMessage.set(err.error?.message || 'Failed to publish quiz.');
            this.isSaving.set(false);
          }
        });
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to save schedule settings.');
        this.isSaving.set(false);
      }
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
