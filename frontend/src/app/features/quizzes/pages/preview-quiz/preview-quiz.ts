import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, Quiz } from '../../../../services/api.service';

@Component({
  selector: 'app-preview-quiz',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './preview-quiz.html',
  styleUrls: ['./preview-quiz.scss']
})
export class QuizPreviewComponent implements OnInit {
  quizId = signal<string>('');
  quiz = signal<Quiz | null>(null);

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.quizId.set(id);
        this.loadQuiz(id);
      }
    });
  }

  loadQuiz(id: string) {
    this.apiService.getQuizDetail(id).subscribe({
      next: (quiz) => this.quiz.set(quiz)
    });
  }
}
