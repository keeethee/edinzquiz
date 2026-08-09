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
    <div class="simple-auth-wrapper page-transition-enter">
      <div class="simple-auth-card">
        
        <!-- Header with Logo and Title -->
        <div class="simple-auth-header">
          <img src="logo.png" alt="INSPYRE" onerror="this.onerror=null; this.src='assets/logo.png';" />
          <h2 class="simple-auth-title">Admin Console</h2>
          <p class="simple-auth-subtitle">Access institutional evaluations, telemetry, and grading</p>
        </div>

        <div *ngIf="errorMsg" class="neo-card" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); padding: 0.75rem 1rem; color: var(--danger-color); margin-bottom: 1.25rem; text-align: center; border-radius: 6px; font-size: 0.88rem;">
          {{ errorMsg }}
        </div>

        <form (ngSubmit)="onSubmit()" (submit)="$event.preventDefault()">
          <div style="margin-bottom: 1.25rem;">
            <label for="adminEmail" style="display: block; margin-bottom: 0.45rem; font-weight: 600; font-size: 0.88rem; color: var(--text-secondary);">Email Address <span style="color: var(--danger-color);">*</span></label>
            <input id="adminEmail" type="email" class="neo-input" [(ngModel)]="email" name="email" placeholder="admin@edinz.com" required />
          </div>

          <div style="margin-bottom: 1.75rem;">
            <label for="adminPassword" style="display: block; margin-bottom: 0.45rem; font-weight: 600; font-size: 0.88rem; color: var(--text-secondary);">Password <span style="color: var(--danger-color);">*</span></label>
            <div style="position: relative;">
              <input id="adminPassword" [type]="showPassword ? 'text' : 'password'" class="neo-input" [(ngModel)]="password" name="password" placeholder="••••••••" required style="padding-right: 2.5rem;" />
              <button type="button" (click)="showPassword = !showPassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.1rem; padding: 0.2rem;" aria-label="Toggle Password Visibility">
                {{ showPassword ? '👁️' : '🙈' }}
              </button>
            </div>
          </div>

          <button type="submit" (click)="onSubmit()" [disabled]="isSubmitting" class="neo-btn neo-btn-primary" style="width: 100%; padding: 0.85rem; font-size: 0.98rem; margin-bottom: 0.5rem;">
            <span *ngIf="isSubmitting" class="blink">Signing In...</span>
            <span *ngIf="!isSubmitting">Sign In to Console</span>
          </button>
        </form>

        <div class="simple-auth-footer">
          🔒 Verified Administrator Operations Engine
        </div>

      </div>
    </div>
  `
})
export class AdminLoginComponent {
  email = '';
  password = '';
  errorMsg = '';
  showPassword = false;
  isSubmitting = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.isSubmitting) return;
    this.errorMsg = '';

    if (!this.email || !this.password) {
      this.errorMsg = 'Email and password are required.';
      return;
    }

    this.isSubmitting = true;
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin']);
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMsg = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
