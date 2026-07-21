import { Routes } from '@angular/router';
import { StudentComponent } from './student/student';
import { AdminLoginComponent } from './admin/login';
import { AdminLayoutComponent } from './layouts/admin-layout';
import { CoursesComponent } from './features/courses/courses';
import { QuizListComponent } from './features/quizzes/pages/quiz-list/quiz-list';
import { CreateQuizComponent } from './features/quizzes/pages/create-quiz/create-quiz';
import { EditQuizComponent } from './features/quizzes/pages/edit-quiz/edit-quiz';
import { QuizPreviewComponent } from './features/quizzes/pages/preview-quiz/preview-quiz';
import { AdminComponent } from './admin/admin';
import { AuthGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', component: StudentComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    canDeactivate: [unsavedChangesGuard]
  },
  { path: '**', redirectTo: '' }
];
