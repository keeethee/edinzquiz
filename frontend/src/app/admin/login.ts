import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-container flex-center" style="min-height: calc(100vh - 4rem);">
      <div class="neo-card" style="width: 100%; max-width: 450px;">
        <h2 style="text-align: center; margin-bottom: 2rem; color: var(--accent-color); font-size: 2rem;">Admin Login</h2>
        
        <div *ngIf="errorMsg" class="neo-card" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); padding: 1rem; color: var(--danger-color); margin-bottom: 1.5rem; text-align: center;">
          {{ errorMsg }}
        </div>

        <form (ngSubmit)="onSubmit()">
          <div style="margin-bottom: 1.5rem;">
            <label for="adminEmail" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email Address</label>
            <input id="adminEmail" type="email" class="neo-input" [(ngModel)]="email" name="email" placeholder="admin@edinz.com" required>
          </div>

          <div style="margin-bottom: 2rem;">
            <label for="adminPassword" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password</label>
            <div style="position: relative;">
              <input id="adminPassword" [type]="showPassword ? 'text' : 'password'" class="neo-input" [(ngModel)]="password" name="password" placeholder="••••••••" required style="padding-right: 2.5rem;">
              <button type="button" (click)="showPassword = !showPassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.15rem; padding: 0.2rem;">
                {{ showPassword ? '👁️' : '🙈' }}
              </button>
            </div>
          </div>

          <button type="submit" class="neo-btn neo-btn-primary" style="width: 100%; padding: 1rem;">
            Sign In
          </button>
        </form>
      </div>
    </div>
  `
})
export class AdminLoginComponent {
  email = '';
  password = '';
  errorMsg = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.errorMsg = '';
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
