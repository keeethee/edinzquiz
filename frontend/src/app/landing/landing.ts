import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="app-container flex-center" style="min-height: calc(100vh - 4rem); flex-direction: column;">
      <div style="text-align: center; margin-bottom: 3rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; background: linear-gradient(135deg, var(--accent-color), var(--text-primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Edinz Portal
        </h1>
        <p style="color: var(--text-secondary); font-size: 1.2rem;">Select your workspace role to begin</p>
      </div>

      <div class="grid-2" style="max-width: 800px; width: 100%;">
        <a routerLink="/student" class="neo-card" style="text-decoration: none; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem;">
          <div class="neo-card-inset flex-center" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 1.5rem; color: var(--accent-color);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 36px; height: 36px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">Student Workspace</h2>
          <p style="color: var(--text-secondary);">Attempt course quizzes and upload assignment submissions.</p>
        </a>

        <a routerLink="/admin" class="neo-card" style="text-decoration: none; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem;">
          <div class="neo-card-inset flex-center" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 1.5rem; color: var(--accent-color);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 36px; height: 36px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">Admin Console</h2>
          <p style="color: var(--text-secondary);">Manage courses, add quiz questions, create assignments, and view grades.</p>
        </a>
      </div>
    </div>
  `
})
export class LandingComponent {}
