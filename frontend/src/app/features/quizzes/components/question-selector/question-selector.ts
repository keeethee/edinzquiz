import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-question-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="question-selector-container">
      <h3 class="bank-heading">📚 Question Bank Pool</h3>
      
      <!-- Filters row -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="search-box">
          <mat-label>Search Question Text</mat-label>
          <input matInput [(ngModel)]="searchQuery" (input)="onFilterChange()" placeholder="Search..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Difficulty</mat-label>
          <mat-select [(ngModel)]="selectedDifficulty" (selectionChange)="onFilterChange()">
            <mat-option value="">All</mat-option>
            <mat-option value="Easy">Easy</mat-option>
            <mat-option value="Medium">Medium</mat-option>
            <mat-option value="Hard">Hard</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="selectedType" (selectionChange)="onFilterChange()">
            <mat-option value="">All</mat-option>
            <mat-option value="MCQ_SINGLE">MCQ (Single Correct)</mat-option>
            <mat-option value="MCQ_MULTIPLE">MCQ (Multiple Correct)</mat-option>
            <mat-option value="TF">True / False</mat-option>
            <mat-option value="FILL_BLANK">Fill in the Blanks</mat-option>
            <mat-option value="SHORT_ANSWER">Short Answer</mat-option>
            <mat-option value="ESSAY">Essay / Descriptive</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Questions List -->
      <div class="list-wrapper">
        <div *ngFor="let q of bankQuestions()" class="question-row" [class.already-added]="isAlreadyLinked(q.id)">
          <div class="checkbox-col">
            <mat-checkbox 
              [disabled]="isAlreadyLinked(q.id)"
              [checked]="isAlreadyLinked(q.id) || selectedIds().includes(q.id)"
              (change)="toggleSelection(q.id)">
            </mat-checkbox>
          </div>
          
          <div class="details-col">
            <div class="question-title">{{ q.question }}</div>
            <div class="badges-row">
              <span class="type-badge">{{ q.questionType }}</span>
              <span class="diff-badge" [ngClass]="q.difficulty.toLowerCase()">{{ q.difficulty }}</span>
              <span *ngIf="isAlreadyLinked(q.id)" class="added-badge">Already Added</span>
            </div>
            <div *ngIf="q.options && q.options.length > 0" class="options-preview">
              Options: <span *ngFor="let opt of q.options" class="opt-label">{{ opt.optionText }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="bankQuestions().length === 0" class="no-items">
          No matching questions in bank.
        </div>
      </div>

      <!-- Pagination Footer -->
      <div class="paginator-footer">
        <button mat-button [disabled]="currentPage() === 1" (click)="prevPage()">
          <mat-icon>chevron_left</mat-icon> Prev
        </button>
        <span class="page-indicator">Page {{ currentPage() }} of {{ totalPages() }}</span>
        <button mat-button [disabled]="currentPage() >= totalPages()" (click)="nextPage()">
          Next <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <div class="actions-row">
        <button mat-raised-button color="primary" 
          [disabled]="selectedIds().length === 0"
          (click)="emitSelection()">
          ➕ Add Selected Questions ({{ selectedIds().length }})
        </button>
      </div>
    </div>
  `,
  styles: [`
    .question-selector-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.02);
    }
    .bank-heading {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .filters-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 2 1 200px;
    }
    .filter-select {
      flex: 1 1 120px;
    }
    .list-wrapper {
      max-height: 380px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-right: 0.25rem;
    }
    .question-row {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    .question-row:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }
    .question-row.already-added {
      opacity: 0.65;
      background: rgba(255, 255, 255, 0.01);
    }
    .checkbox-col {
      display: flex;
      align-items: center;
    }
    .details-col {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }
    .question-title {
      font-size: 0.9rem;
      font-weight: 550;
      color: #fff;
    }
    .badges-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .type-badge, .diff-badge, .added-badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .type-badge {
      background: rgba(63, 81, 181, 0.15);
      color: #7986cb;
    }
    .diff-badge.easy { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .diff-badge.medium { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .diff-badge.hard { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .added-badge {
      background: rgba(156, 163, 175, 0.15);
      color: #d1d5db;
    }
    .options-preview {
      font-size: 0.75rem;
      color: #a3a3a3;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .opt-label {
      background: rgba(255, 255, 255, 0.05);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
    }
    .paginator-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .page-indicator {
      color: #a3a3a3;
    }
    .actions-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
    .no-items {
      text-align: center;
      padding: 2rem;
      color: #a3a3a3;
      font-size: 0.85rem;
    }
  `]
})
export class QuestionSelectorComponent implements OnInit {
  @Input() courseId!: string;
  @Input() linkedQuestionIds: string[] = []; // IDs already in the quiz
  @Output() addSelectedQuestions = new EventEmitter<string[]>();

  bankQuestions = signal<any[]>([]);
  selectedIds = signal<string[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  searchQuery: string = '';
  selectedDifficulty: string = '';
  selectedType: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchBank();
  }

  fetchBank() {
    this.apiService.getQuestionBank({
      courseId: this.courseId,
      difficulty: this.selectedDifficulty || undefined,
      questionType: this.selectedType || undefined,
      search: this.searchQuery || undefined,
      page: this.currentPage(),
      limit: 5
    }).subscribe({
      next: (res) => {
        this.bankQuestions.set(res.items);
        this.totalPages.set(res.totalPages || 1);
      }
    });
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.fetchBank();
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.fetchBank();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.fetchBank();
    }
  }

  toggleSelection(id: string) {
    this.selectedIds.update((ids) => {
      if (ids.includes(id)) {
        return ids.filter((item) => item !== id);
      } else {
        return [...ids, id];
      }
    });
  }

  isAlreadyLinked(id: string): boolean {
    return this.linkedQuestionIds.includes(id);
  }

  emitSelection() {
    this.addSelectedQuestions.emit(this.selectedIds());
    this.selectedIds.set([]); // Clear selections
  }
}
