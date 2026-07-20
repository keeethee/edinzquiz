import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="header-bar">
      <div class="header-left-brand">
        <div class="logo-pill">
          <span class="logo-blue">edinz</span>
          <span class="logo-orange">QUIZ</span>
        </div>
        <span class="console-title">ADMIN CONSOLE</span>
      </div>

      <div class="nav-links">
        <a mat-button routerLink="/admin/courses" routerLinkActive="active-link">Courses</a>
        <a mat-button routerLink="/admin/quizzes" routerLinkActive="active-link">Quizzes</a>
        <a mat-button routerLink="/admin/assignments" routerLinkActive="active-link">Assignments</a>
        <button mat-button class="logout-btn" (click)="logout()">
          <mat-icon>logout</mat-icon> Logout
        </button>
      </div>
    </div>

    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 2rem;
      background: #111116;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-left-brand {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .logo-pill {
      font-weight: 800;
      font-size: 1.4rem;
      letter-spacing: -0.02em;
    }
    .logo-blue { color: #5c6bc0; }
    .logo-orange { color: #ffa726; }
    .console-title {
      font-size: 0.9rem;
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 0.08em;
    }
    .nav-links {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    a.mat-mdc-button {
      color: #94a3b8 !important;
      font-weight: 550;
      border-radius: 6px;
      padding: 0.5rem 1rem;
    }
    .active-link {
      background: rgba(255, 255, 255, 0.06) !important;
      color: #fff !important;
      border-bottom: 2px solid #5c6bc0;
    }
    .logout-btn {
      color: #ef4444 !important;
      font-weight: 600 !important;
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    .app-container {
      min-height: calc(100vh - 60px);
      background: #09090b;
      color: #fff;
    }
  `]
})
export class AdminLayoutComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
