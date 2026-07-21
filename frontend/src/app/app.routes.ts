import { Routes } from '@angular/router';
import { StudentComponent } from './student/student';
import { AdminLoginComponent } from './admin/login';
import { AdminLayoutComponent } from './layouts/admin-layout';
import { CoursesComponent } from './features/courses/courses';
import { QuizListComponent } from './features/quizzes/pages/quiz-list/quiz-list';
import { CreateQuizComponent } from './features/quizzes/pages/create-quiz/create-quiz';
import { EditQuizComponent } from './features/quizzes/pages/edit-quiz/edit-quiz';
import { QuizPreviewComponent } from './features/quizzes/pages/preview-quiz/preview-quiz';
import { AssignmentsComponent } from './features/assignments/assignments';
import { ImportQuestionsComponent } from './features/questions/import/import-questions';
import { AuthGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', component: StudentComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'quizzes', pathMatch: 'full' },
      { path: 'courses', component: CoursesComponent },
      { path: 'quizzes', component: QuizListComponent },
      { path: 'quizzes/create', component: CreateQuizComponent },
      { path: 'quizzes/edit/:id', component: EditQuizComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'quizzes/preview/:id', component: QuizPreviewComponent },
      { path: 'questions/import', component: ImportQuestionsComponent },
      { path: 'assignments', component: AssignmentsComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
