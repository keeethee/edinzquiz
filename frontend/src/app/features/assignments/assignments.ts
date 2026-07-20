import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, Course, Assignment } from '../../services/api.service';

@Component({
  selector: 'app-assignments',
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
  templateUrl: './assignments.html',
  styleUrls: ['./assignments.scss']
})
export class AssignmentsComponent implements OnInit {
  courses = signal<Course[]>([]);
  selectedCourseId = signal<string>('');
  assignments = signal<Assignment[]>([]);
  isLoading = signal<boolean>(false);

  newTitle = '';
  newDescription = '';
  newDeadline = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.apiService.getCourses().subscribe({
      next: (list) => {
        this.courses.set(list);
        if (list.length > 0) {
          this.selectedCourseId.set(list[0].id);
          this.loadAssignments(list[0].id);
        }
      }
    });
  }

  onCourseChange(courseId: string) {
    this.selectedCourseId.set(courseId);
    this.loadAssignments(courseId);
  }

  loadAssignments(courseId: string) {
    this.isLoading.set(true);
    this.apiService.getAssignments(courseId).subscribe({
      next: (list) => {
        this.assignments.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  createAssignment() {
    if (!this.newTitle || !this.newDeadline) {
      alert('Title and Deadline are required.');
      return;
    }

    this.apiService.createAssignment(
      this.selectedCourseId(),
      this.newTitle,
      this.newDescription,
      this.newDeadline
    ).subscribe({
      next: () => {
        this.newTitle = '';
        this.newDescription = '';
        this.newDeadline = '';
        this.loadAssignments(this.selectedCourseId());
      },
      error: (err) => alert(err.error?.message || 'Error creating assignment.')
    });
  }

  deleteAssignment(id: string) {
    if (confirm('Are you sure you want to delete this assignment?')) {
      this.apiService.deleteAssignment(id).subscribe({
        next: () => this.loadAssignments(this.selectedCourseId())
      });
    }
  }
}
