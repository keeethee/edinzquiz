import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, Course } from '../../services/api.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './courses.html',
  styleUrls: ['./courses.scss']
})
export class CoursesComponent implements OnInit {
  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(false);

  newCourseIdCode = '';
  newCourseName = '';
  newCourseDuration = '';
  newCourseStatus = 'Active';

  editingCourse = signal<Course | null>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.isLoading.set(true);
    this.apiService.getCourses().subscribe({
      next: (list) => {
        this.courses.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  createCourse() {
    if (!this.newCourseIdCode || !this.newCourseName) {
      alert('Course Code and Name are required.');
      return;
    }

    this.apiService.createCourse(
      this.newCourseIdCode.toUpperCase(),
      this.newCourseName,
      this.newCourseDuration,
      this.newCourseStatus
    ).subscribe({
      next: () => {
        this.newCourseIdCode = '';
        this.newCourseName = '';
        this.newCourseDuration = '';
        this.newCourseStatus = 'Active';
        this.loadCourses();
      },
      error: (err) => alert(err.error?.message || 'Error creating course.')
    });
  }

  editCourse(course: Course) {
    this.editingCourse.set({ ...course });
  }

  saveCourseEdit() {
    const edit = this.editingCourse();
    if (!edit) return;

    this.apiService.updateCourse(
      edit.id,
      edit.courseId.toUpperCase(),
      edit.courseName,
      edit.duration,
      edit.status
    ).subscribe({
      next: () => {
        this.editingCourse.set(null);
        this.loadCourses();
      },
      error: (err) => alert(err.error?.message || 'Error updating course.')
    });
  }

  cancelEdit() {
    this.editingCourse.set(null);
  }

  deleteCourse(id: string) {
    if (confirm('Are you sure you want to delete this course? All quizzes and assignments will be deleted.')) {
      this.apiService.deleteCourse(id).subscribe({
        next: () => this.loadCourses()
      });
    }
  }
}
