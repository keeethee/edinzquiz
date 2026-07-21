import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-import-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule
  ],
  template: `
    <div class="preview-container">
      <div class="preview-header">
        <h3>👀 Preview Parsed Questions</h3>
        <p class="subtitle">Review parsed questions, edit details, and resolve duplicates before saving.</p>
      </div>

      <!-- Main preview table -->
      <div class="table-wrapper">
        <table class="neo-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Question Text</th>
              <th>Type</th>
              <th>Difficulty</th>
              <th>Marks</th>
              <th>Status</th>
              <th style="text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let q of questions; let idx = index" [class.duplicate-row]="q.isDuplicateInDb">
              <td class="row-num">#{{ idx + 2 }}</td>
              <td class="q-text-cell">{{ q.question }}</td>
              <td>
                <span class="type-badge">{{ q.questionType }}</span>
              </td>
              <td>
                <span class="diff-badge" [attr.data-diff]="q.difficulty">{{ q.difficulty }}</span>
              </td>
              <td class="marks-val">{{ q.marks }} pt</td>
              <td>
                <span class="status-indicator duplicate" *ngIf="q.isDuplicateInDb">
                  <mat-icon>warning</mat-icon> Matches DB
                </span>
                <span class="status-indicator ready" *ngIf="!q.isDuplicateInDb">
                  <mat-icon>check_circle</mat-icon> Ready
                </span>
              </td>
              <td style="text-align: center;">
                <button mat-icon-button color="accent" (click)="openEditModal(q, idx)">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Edit Dialog Overlay (Custom Glassmorphism Modal) -->
      <div class="modal-backdrop" *ngIf="editingIndex() !== null">
        <div class="modal-card">
          <div class="modal-header">
            <h4>✏️ Edit Question Details</h4>
            <button mat-icon-button (click)="closeEditModal()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="modal-body" *ngIf="editModel()">
            <div class="form-grid">
              <div class="full-width">
                <label>Question Text *</label>
                <textarea rows="3" [(ngModel)]="editModel()!.question" class="neo-input"></textarea>
              </div>

              <div>
                <label>Difficulty</label>
                <select [(ngModel)]="editModel()!.difficulty" class="neo-select">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label>Marks</label>
                <input type="number" [(ngModel)]="editModel()!.marks" class="neo-input" />
              </div>

              <div class="full-width">
                <label>Explanation / Rationale</label>
                <textarea rows="2" [(ngModel)]="editModel()!.explanation" class="neo-input"></textarea>
              </div>

              <!-- Options section for choice-based questions -->
              <div class="full-width options-section" *ngIf="showOptionsList()">
                <label>Choices Options</label>
                <div class="option-row" *ngFor="let opt of editModel()!.options; let oIdx = index">
                  <span class="option-label">Option {{ getOptionLetter(oIdx) }}</span>
                  <input type="text" [(ngModel)]="opt.optionText" class="neo-input option-input" />
                  <mat-checkbox [(ngModel)]="opt.isCorrect" (change)="onCorrectOptionChanged(oIdx)">
                    Correct
                  </mat-checkbox>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button mat-button (click)="closeEditModal()">Cancel</button>
            <button mat-raised-button color="primary" (click)="saveEdit()">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .preview-header {
      text-align: left;
      h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #fff;
      }
      .subtitle {
        font-size: 0.85rem;
        color: #a3a3a3;
        margin: 0;
      }
    }

    .table-wrapper {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.2);
    }

    .neo-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;

      th {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        font-weight: 700;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        color: #e5e5e5;
        vertical-align: middle;
      }

      .duplicate-row {
        background: rgba(245, 158, 11, 0.04);
      }

      .row-num {
        color: #737373;
        font-weight: 600;
      }

      .q-text-cell {
        max-width: 300px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .type-badge {
      background: rgba(255, 255, 255, 0.06);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #cbd5e1;
    }

    .diff-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;

      &[data-diff="Easy"] { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
      &[data-diff="Medium"] { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      &[data-diff="Hard"] { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    }

    .marks-val {
      font-weight: 600;
      color: var(--accent-color, #673ab7);
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &.ready { color: #10b981; }
      &.duplicate { color: #f59e0b; }
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-card {
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h4 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #fff;
      }
    }

    .modal-body {
      padding: 1.5rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;

      .full-width {
        grid-column: span 2;
      }

      label {
        display: block;
        font-size: 0.8rem;
        color: #a3a3a3;
        margin-bottom: 0.35rem;
        font-weight: 600;
      }
    }

    .neo-input, .neo-select {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.6rem;
      color: #fff;
      font-size: 0.9rem;
      box-sizing: border-box;

      &:focus {
        border-color: var(--accent-color, #673ab7);
        outline: none;
      }
    }

    .options-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 1rem;
      border-radius: 8px;
      margin-top: 0.5rem;
    }

    .option-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;

      .option-label {
        font-size: 0.8rem;
        color: #a3a3a3;
        min-width: 65px;
        font-weight: 600;
      }

      .option-input {
        flex: 1;
      }
    }

    .modal-footer {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class ImportPreviewComponent {
  @Input() questions: any[] = [];
  @Output() questionsChanged = new EventEmitter<any[]>();

  editingIndex = signal<number | null>(null);
  editModel = signal<any | null>(null);

  openEditModal(question: any, index: number) {
    this.editingIndex.set(index);
    // Deep clone the object to ensure independent editing (never sharing references!)
    this.editModel.set(JSON.parse(JSON.stringify(question)));
  }

  closeEditModal() {
    this.editingIndex.set(null);
    this.editModel.set(null);
  }

  saveEdit() {
    const idx = this.editingIndex();
    const model = this.editModel();
    if (idx !== null && model) {
      // Immutably replace the edited object in the questions array
      const updated = [...this.questions];
      updated[idx] = model;
      this.questionsChanged.emit(updated);
      this.closeEditModal();
    }
  }

  showOptionsList(): boolean {
    const model = this.editModel();
    if (!model) return false;
    return ['MCQ_SINGLE', 'MCQ_MULTIPLE', 'TF'].includes(model.questionType);
  }

  getOptionLetter(idx: number): string {
    return String.fromCharCode(65 + idx); // 0 -> A, 1 -> B, etc.
  }

  onCorrectOptionChanged(oIdx: number) {
    const model = this.editModel();
    if (!model) return;

    // If MCQ_SINGLE or TF, uncheck other options
    if (['MCQ_SINGLE', 'TF'].includes(model.questionType) && model.options[oIdx].isCorrect) {
      model.options.forEach((opt: any, idx: number) => {
        if (idx !== oIdx) {
          opt.isCorrect = false;
        }
      });
    }
  }
}
