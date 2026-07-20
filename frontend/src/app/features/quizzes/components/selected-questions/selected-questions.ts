import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-selected-questions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="selected-questions-container">
      <h3 class="section-title">📝 Assigned Questions ({{ questions.length }})</h3>

      <div class="questions-list">
        <div *ngFor="let item of questions; let idx = index; trackBy: trackByFn" class="selected-row">
          <div class="order-controls">
            <button mat-icon-button [disabled]="idx === 0" (click)="moveUp(idx)" class="arrow-btn" title="Move Up">
              <mat-icon>arrow_upward</mat-icon>
            </button>
            <span class="index-num">#{{ idx + 1 }}</span>
            <button mat-icon-button [disabled]="idx === questions.length - 1" (click)="moveDown(idx)" class="arrow-btn" title="Move Down">
              <mat-icon>arrow_downward</mat-icon>
            </button>
          </div>

          <div class="question-details">
            <div class="text">{{ item.question?.question }}</div>
            <div class="badges">
              <span class="badge type">{{ item.question?.questionType }}</span>
              <span class="badge diff" [ngClass]="item.question?.difficulty.toLowerCase()">{{ item.question?.difficulty }}</span>
            </div>
          </div>

          <div class="marks-config">
            <mat-form-field appearance="outline" class="marks-input-field">
              <mat-label>Marks</mat-label>
              <input matInput type="number" [ngModel]="item.marks" (ngModelChange)="onMarksChange(idx, $event)" min="1" />
            </mat-form-field>
          </div>

          <div class="delete-col">
            <button mat-icon-button color="warn" (click)="remove(idx)" title="Remove question from Quiz">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <div *ngIf="questions.length === 0" class="empty-list">
          No questions assigned to this quiz yet. Add questions from the question bank pool.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .selected-questions-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.02);
    }
    .section-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .selected-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }
    .order-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.1rem;
    }
    .arrow-btn {
      width: 28px;
      height: 28px;
      line-height: 28px;
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    .index-num {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary-color, #3f51b5);
    }
    .question-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .text {
      font-size: 0.9rem;
      font-weight: 550;
      color: #fff;
    }
    .badges {
      display: flex;
      gap: 0.5rem;
    }
    .badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .badge.type {
      background: rgba(63, 81, 181, 0.15);
      color: #7986cb;
    }
    .badge.diff.easy { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge.diff.medium { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .badge.diff.hard { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    .marks-config {
      width: 80px;
    }
    .marks-input-field {
      width: 100%;
      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }
    .empty-list {
      text-align: center;
      padding: 2.5rem;
      color: #a3a3a3;
      font-size: 0.9rem;
    }
  `]
})
export class SelectedQuestionsComponent {
  @Input() questions: any[] = [];
  @Output() removeQuestion = new EventEmitter<string>();
  @Output() reorder = new EventEmitter<any[]>();
  @Output() marksChanged = new EventEmitter<{ index: number; marks: number }>();

  trackByFn(index: number, item: any): string {
    return item.id || index.toString();
  }

  moveUp(index: number) {
    if (index > 0) {
      const copy = [...this.questions];
      [copy[index], copy[index - 1]] = [copy[index - 1], copy[index]];
      this.reorder.emit(copy);
    }
  }

  moveDown(index: number) {
    if (index < this.questions.length - 1) {
      const copy = [...this.questions];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      this.reorder.emit(copy);
    }
  }

  onMarksChange(index: number, newMarks: any) {
    const val = parseInt(newMarks, 10);
    if (!isNaN(val) && val >= 1) {
      this.marksChanged.emit({ index, marks: val });
    }
  }

  remove(index: number) {
    const qId = this.questions[index].questionId;
    this.removeQuestion.emit(qId);
  }
}
