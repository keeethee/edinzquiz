import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-import-summary',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="summary-container">
      <div class="status-cards">
        <mat-card class="status-card success">
          <mat-card-content>
            <div class="card-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ successCount }}</div>
              <div class="card-label">Questions Ready to Import</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="status-card errors" *ngIf="failedCount > 0">
          <mat-card-content>
            <div class="card-icon">
              <mat-icon>error</mat-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ failedCount }}</div>
              <div class="card-label">Parsing Errors Detected</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Errors Report list -->
      <div class="errors-section" *ngIf="errors.length > 0">
        <div class="section-header">
          <h4>❌ Row Parsing Errors Report</h4>
          <button mat-stroked-button color="warn" (click)="downloadErrorReport()">
            <mat-icon>download</mat-icon> Download Error Report (.csv)
          </button>
        </div>
        <div class="errors-list">
          <div class="error-item" *ngFor="let err of errors">
            <span class="error-row">Row {{ err.row }}</span>
            <span class="error-msg">{{ err.message }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="actions-panel">
        <button mat-button class="cancel-btn" (click)="cancel.emit()">
          Cancel
        </button>
        <div class="save-actions">
          <button mat-raised-button color="primary" 
                  [disabled]="successCount === 0 || isSaving" 
                  (click)="save.emit('Draft')">
            <mat-icon>save</mat-icon> Save to Question Bank
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .status-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .status-card {
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      border-radius: 12px;
      
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1.5rem !important;
      }

      .card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
      }

      .card-value {
        font-size: 2rem;
        font-weight: 800;
        color: #fff;
        line-height: 1;
        margin-bottom: 0.25rem;
      }

      .card-label {
        font-size: 0.85rem;
        color: #a3a3a3;
        font-weight: 550;
      }

      &.success {
        background: rgba(16, 185, 129, 0.05);
        border-color: rgba(16, 185, 129, 0.15);
        .card-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      }

      &.errors {
        background: rgba(239, 68, 68, 0.05);
        border-color: rgba(239, 68, 68, 0.15);
        .card-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      }
    }

    .errors-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      border-radius: 12px;
      padding: 1.5rem;
      text-align: left;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h4 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: #fff;
      }
    }

    .errors-list {
      max-height: 250px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 0.75rem;
    }

    .error-item {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      font-size: 0.85rem;
      padding: 0.5rem;
      border-radius: 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);

      &:last-child {
        border-bottom: none;
      }

      .error-row {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
        min-width: 60px;
        text-align: center;
      }

      .error-msg {
        color: #ef4444;
      }
    }

    .actions-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }

    .save-actions {
      display: flex;
      gap: 0.75rem;

      button {
        padding: 0.6rem 1.75rem;
        font-weight: 600;
        border-radius: 8px;
      }
    }

    .cancel-btn {
      color: #737373 !important;
      font-weight: 600;
    }
  `]
})
export class ImportSummaryComponent {
  @Input() successCount = 0;
  @Input() failedCount = 0;
  @Input() errors: { row: number; message: string }[] = [];
  @Input() isSaving = false;

  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  downloadErrorReport() {
    const csvRows = ['Row,Error Message'];
    this.errors.forEach(err => {
      // Escape commas and quotes
      const escapedMsg = `"${err.message.replace(/"/g, '""')}"`;
      csvRows.push(`${err.row},${escapedMsg}`);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'question_import_errors_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
