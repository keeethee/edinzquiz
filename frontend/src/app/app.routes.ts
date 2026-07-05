import { Routes } from '@angular/router';
import { StudentComponent } from './student/student';
import { AdminComponent } from './admin/admin';
import { AdminLoginComponent } from './admin/login';
import { AuthGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', component: StudentComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard], canDeactivate: [unsavedChangesGuard] },
  { path: '**', redirectTo: '' }
];
