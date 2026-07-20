import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, Quiz, Course } from '../../../../services/api.service';
import { PublishDialogComponent } from '../../components/publish-dialog/publish-dialog';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './quiz-list.html',
  styleUrls: ['./quiz-list.scss']
})
export class QuizListComponent implements OnInit {
  // Signals for state management
  courses = signal<Course[]>([]);
  selectedCourseId = signal<string>('');
  quizzes = signal<Quiz[]>([]);
  isLoading = signal<boolean>(false);

  displayedColumns = ['title', 'course', 'questionsCount', 'duration', 'status', 'createdAt', 'actions'];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.apiService.getCourses().subscribe({
      next: (list) => {
        this.courses.set(list);
        if (list.length > 0) {
          this.selectedCourseId.set(list[0].id);
          this.loadQuizzes(list[0].id);
        }
      }
    });
  }

  onCourseChange(courseId: string) {
    this.selectedCourseId.set(courseId);
    this.loadQuizzes(courseId);
  }

  loadQuizzes(courseId: string) {
    this.isLoading.set(true);
    this.apiService.getQuizzes(courseId).subscribe({
      next: (list) => {
        this.quizzes.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  editQuiz(id: string) {
    this.router.navigate(['/admin/quizzes/edit', id]);
  }

  previewQuiz(id: string) {
    this.router.navigate(['/admin/quizzes/preview', id]);
  }

  createQuiz() {
    this.router.navigate(['/admin/quizzes/create'], {
      queryParams: { courseId: this.selectedCourseId() }
    });
  }

  duplicateQuiz(id: string) {
    this.apiService.duplicateQuiz(id).subscribe({
      next: () => this.loadQuizzes(this.selectedCourseId())
    });
  }

  deleteQuiz(id: string) {
    if (confirm('Are you sure you want to delete this quiz?')) {
      this.apiService.deleteQuiz(id).subscribe({
        next: () => this.loadQuizzes(this.selectedCourseId())
      });
    }
  }

  openPublishDialog(quiz: Quiz) {
    const dialogRef = this.dialog.open(PublishDialogComponent, {
      width: '450px',
      data: { quiz }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadQuizzes(this.selectedCourseId());
      }
    });
  }

  unpublishQuiz(id: string) {
    this.apiService.unpublishQuiz(id).subscribe({
      next: () => this.loadQuizzes(this.selectedCourseId())
    });
  }
}
