import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService, Course } from '../../../services/api.service';
import { UploadExcelComponent } from './upload-excel';
import { ImportPreviewComponent } from './import-preview';
import { ImportSummaryComponent } from './import-summary';

@Component({
  selector: 'app-import-questions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    UploadExcelComponent,
    ImportPreviewComponent,
    ImportSummaryComponent
  ],
  template: `
    <div class="page-container">
      <div class="header-row">
        <div class="header-left">
          <a routerLink="/admin" class="back-link">
            <mat-icon>arrow_back</mat-icon> Back to Dashboard
          </a>
          <h2 class="title">📥 Bulk Question Import</h2>
        </div>
      </div>

      <!-- Step Indicator -->
      <div class="step-indicator">
        <div class="step" [class.active]="step() === 1" [class.completed]="step() > 1">
          <span class="step-num">1</span>
          <span class="step-label">Choose Course & Upload</span>
        </div>
        <div class="step-line"></div>
        <div class="step" [class.active]="step() === 2" [class.completed]="step() > 2">
          <span class="step-num">2</span>
          <span class="step-label">Preview & Save</span>
        </div>
      </div>

      <mat-card class="neo-card-main">
        <mat-card-content>
          
          <!-- Loading state -->
          <div class="loading-overlay" *ngIf="isLoading()">
            <mat-progress-bar mode="query" color="accent"></mat-progress-bar>
            <div class="loading-text">{{ loadingMessage() }}</div>
          </div>

          <!-- Error Alert banner -->
          <div class="error-banner" *ngIf="errorMessage()">
            <mat-icon>error</mat-icon>
            <span>{{ errorMessage() }}</span>
            <button mat-icon-button (click)="errorMessage.set('')">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Step 1: Upload and Course Select -->
          <div *ngIf="step() === 1" class="step-content">
            <div class="course-selector-box">
              <mat-form-field appearance="outline" color="accent" style="width: 100%; max-width: 400px;">
                <mat-label>Select Target Course *</mat-label>
                <mat-select [value]="selectedCourseId()" (selectionChange)="onCourseChanged($event.value)">
                  <mat-option *ngFor="let course of courses()" [value]="course.id">
                    {{ course.courseName }} ({{ course.courseId }})
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <p class="helper-text" *ngIf="!selectedCourseId()">
                Please select a course to load the question bank import utility.
              </p>
            </div>

            <div class="upload-box" *ngIf="selectedCourseId()">
              <app-upload-excel (fileSelected)="onFileUploaded($event)"></app-upload-excel>
            </div>
          </div>

          <!-- Step 2: Preview, Edit and Summary -->
          <div *ngIf="step() === 2" class="step-content preview-split">
            <div class="preview-panel">
              <app-import-preview 
                [questions]="parsedQuestions()"
                (questionsChanged)="onQuestionsChanged($event)">
              </app-import-preview>
            </div>
            
            <div class="summary-panel">
              <app-import-summary
                [successCount]="parsedQuestions().length"
                [failedCount]="errorsList().length"
                [errors]="errorsList()"
                [isSaving]="isSaving()"
                (save)="onFinalSave($event)"
                (cancel)="resetWizard()">
              </app-import-summary>
            </div>
          </div>

        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 80vh;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
      color: var(--accent-color, #673ab7);
      text-decoration: none;
      font-weight: 550;
      margin-bottom: 0.5rem;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 800;
      color: #fff;
    }

    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2.5rem;
      gap: 1.5rem;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      opacity: 0.5;
      transition: all 0.3s ease;

      .step-num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .step-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #fff;
      }

      &.active {
        opacity: 1;
        .step-num {
          background: var(--accent-color, #673ab7);
          border-color: var(--accent-color, #673ab7);
        }
      }

      &.completed {
        opacity: 0.8;
        .step-num {
          background: #10b981;
          border-color: #10b981;
          color: #fff;
        }
      }
    }

    .step-line {
      flex: 0 0 100px;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
    }

    .neo-card-main {
      background: var(--glass-bg, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      border-radius: 16px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(17, 24, 39, 0.8);
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;

      .loading-text {
        font-size: 0.95rem;
        font-weight: 600;
        color: #fff;
      }
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #f87171;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;

      button {
        margin-left: auto;
        color: #f87171;
      }
    }

    .course-selector-box {
      margin-bottom: 2rem;
      text-align: left;

      .helper-text {
        font-size: 0.85rem;
        color: #a3a3a3;
        margin: 0.5rem 0 0 0;
      }
    }

    .preview-split {
      display: grid;
      grid-template-columns: 2.2fr 1fr;
      gap: 2rem;
      align-items: start;
    }

    @media (max-width: 960px) {
      .preview-split {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ImportQuestionsComponent implements OnInit {
  step = signal<number>(1);
  courses = signal<Course[]>([]);
  selectedCourseId = signal<string>('');
  
  // Wizards state lists
  parsedQuestions = signal<any[]>([]);
  errorsList = signal<any[]>([]);

  // Page loader states
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  loadingMessage = signal<string>('');
  errorMessage = signal<string>('');

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading.set(true);
    this.loadingMessage.set('Loading course data...');
    this.apiService.getCourses().subscribe({
      next: (list: Course[]) => {
        this.courses.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load courses list.');
        this.isLoading.set(false);
      }
    });
  }

  onCourseChanged(courseId: string) {
    this.selectedCourseId.set(courseId);
  }

  onFileUploaded(file: File) {
    this.isLoading.set(true);
    this.loadingMessage.set('Uploading & parsing workbook spreadsheet...');
    this.errorMessage.set('');

    this.apiService.importQuestions(this.selectedCourseId(), file).subscribe({
      next: (res: any) => {
        this.parsedQuestions.set(res.questions);
        this.errorsList.set(res.errors);
        this.isLoading.set(false);
        this.step.set(2);
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Failed to parse the Excel document. Please verify structure.');
        this.isLoading.set(false);
      }
    });
  }

  onQuestionsChanged(questions: any[]) {
    this.parsedQuestions.set(questions);
  }

  onFinalSave(status: string) {
    this.isSaving.set(true);
    this.isLoading.set(true);
    this.loadingMessage.set('Bulk inserting questions into database...');

    this.apiService.bulkSaveQuestions(this.selectedCourseId(), this.parsedQuestions()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isLoading.set(false);
        alert(`Successfully imported ${this.parsedQuestions().length} questions to the Question Bank.`);
        this.router.navigate(['/admin']);
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Bulk insert transaction failed.');
        this.isSaving.set(false);
        this.isLoading.set(false);
      }
    });
  }

  resetWizard() {
    this.parsedQuestions.set([]);
    this.errorsList.set([]);
    this.step.set(1);
  }
}
