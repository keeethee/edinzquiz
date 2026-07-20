import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../../../services/api.service';

@Component({
  selector: 'app-quiz-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div [formGroup]="parentForm" class="quiz-metadata-form">
      <div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quiz Name</mat-label>
          <input matInput formControlName="quizTitle" placeholder="e.g. Mid-term DevOps Assessment" required />
          <mat-error *ngIf="parentForm.get('quizTitle')?.hasError('required')">
            Quiz Name is required.
          </mat-error>
        </mat-form-field>
      </div>

      <div class="grid-2">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <mat-select formControlName="categoryId">
            <mat-option [value]="null">Select Category</mat-option>
            <mat-option *ngFor="let cat of categories()" [value]="cat.id">
              {{ cat.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Difficulty Level</mat-label>
          <mat-select formControlName="difficulty">
            <mat-option value="Easy">Easy</mat-option>
            <mat-option value="Medium">Medium</mat-option>
            <mat-option value="Hard">Hard</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description / Guidelines</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Enter instructions for students..."></textarea>
        </mat-form-field>
      </div>

      <div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Instructions</mat-label>
          <textarea matInput formControlName="instructions" rows="2" placeholder="e.g. Please do not refresh the page..."></textarea>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .quiz-metadata-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .full-width {
      width: 100%;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
  `]
})
export class QuizFormComponent implements OnInit {
  @Input() parentForm!: FormGroup;
  categories = signal<any[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (list) => this.categories.set(list)
    });
  }
}
