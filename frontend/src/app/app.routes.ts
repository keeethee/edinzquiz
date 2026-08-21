import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./student/student').then(m => m.StudentComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login').then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin').then(m => m.AdminComponent),
    canActivate: [AuthGuard],
    canDeactivate: [unsavedChangesGuard],
  },
  { path: '**', redirectTo: '' },
];
