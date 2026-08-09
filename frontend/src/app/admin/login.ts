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
    <div class="auth-split-wrapper page-transition-enter">
      <!-- LEFT HERO PANEL -->
      <div class="auth-hero-left">
        <div class="auth-hero-glow-1"></div>
        <div class="auth-hero-glow-2"></div>

        <div style="position: relative; z-index: 2;">
          <div class="logo-pill" style="display: inline-flex; margin-bottom: 2.5rem;">
            <img src="logo.png" alt="INSPYRE" style="height: 48px; width: auto; max-width: 220px; object-fit: contain; display: block;" onerror="this.onerror=null; this.src='assets/logo.png';" />
          </div>

          <h1 style="font-size: 2.2rem; font-weight: 800; line-height: 1.25; margin-bottom: 1rem; color: #ffffff;">
            Admin Operations & Evaluation Command Center
          </h1>
          <p style="font-size: 1.05rem; color: rgba(255, 255, 255, 0.85); line-height: 1.6; margin-bottom: 2.5rem; max-width: 520px;">
            Secure institutional dashboard for curriculum tracking, live assessment telemetry, and automated AI evaluation supervision.
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.85rem; max-width: 520px;">
            <div class="auth-hero-feature-card">
              <div style="font-size: 1.8rem;">📊</div>
              <div>
                <h4 style="font-size: 1.02rem; font-weight: 700; margin: 0 0 0.2rem 0; color: #ffffff;">Live Executive Telemetry</h4>
                <p style="font-size: 0.84rem; color: rgba(255,255,255,0.78); margin: 0;">Real-time student attempt logs, pass/fail benchmarks, and CSV analytics exports.</p>
              </div>
            </div>

            <div class="auth-hero-feature-card">
              <div style="font-size: 1.8rem;">🤖</div>
              <div>
                <h4 style="font-size: 1.02rem; font-weight: 700; margin: 0 0 0.2rem 0; color: #ffffff;">AI Homework & Code Grading</h4>
                <p style="font-size: 0.84rem; color: rgba(255,255,255,0.78); margin: 0;">Supervise deterministic AI evaluations, review rubrics, and publish verified scores.</p>
              </div>
            </div>
          </div>
        </div>

        <div style="position: relative; z-index: 2; display: flex; align-items: center; gap: 0.6rem; color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 2rem;">
          <span>🔒</span> Verified Administrator Operations Console
        </div>
      </div>

      <!-- RIGHT FORM PANEL -->
      <div class="auth-form-right">
        <div class="neo-card" style="width: 100%; max-width: 440px; padding: 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          <h2 style="font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.4rem;">Admin Sign In</h2>
          <p style="color: var(--text-secondary); font-size: 0.92rem; margin-bottom: 1.75rem;">Access the institutional operations portal</p>
          
          <div *ngIf="errorMsg" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.85rem 1rem; color: var(--danger-color); margin-bottom: 1.25rem; text-align: center; border-radius: 6px; font-size: 0.88rem;">
            {{ errorMsg }}
          </div>

          <form (ngSubmit)="onSubmit()" (submit)="$event.preventDefault()">
            <div style="margin-bottom: 1.25rem;">
              <label for="adminEmail" style="display: block; margin-bottom: 0.45rem; font-weight: 600; font-size: 0.88rem; color: var(--text-secondary);">Email Address</label>
              <input id="adminEmail" type="email" class="neo-input" [(ngModel)]="email" name="email" placeholder="admin@edinz.com" required>
            </div>

            <div style="margin-bottom: 1.75rem;">
              <label for="adminPassword" style="display: block; margin-bottom: 0.45rem; font-weight: 600; font-size: 0.88rem; color: var(--text-secondary);">Password</label>
              <div style="position: relative;">
                <input id="adminPassword" [type]="showPassword ? 'text' : 'password'" class="neo-input" [(ngModel)]="password" name="password" placeholder="••••••••" required style="padding-right: 2.5rem;">
                <button type="button" (click)="showPassword = !showPassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.1rem; padding: 0.2rem;">
                  {{ showPassword ? '👁️' : '🙈' }}
                </button>
              </div>
            </div>

            <button type="submit" (click)="onSubmit()" [disabled]="isSubmitting" class="neo-btn neo-btn-primary" style="width: 100%; padding: 0.85rem; font-size: 0.98rem;">
              <span *ngIf="isSubmitting" class="blink">Signing In...</span>
              <span *ngIf="!isSubmitting">Sign In</span>
            </button>
          </form>
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
