import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timer-badge" [class.danger]="isTimeLow()">
      <span class="timer-icon">⏰</span>
      <span class="timer-text">{{ formattedTime() }}</span>
    </div>
  `,
  styles: [`
    .timer-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      font-weight: 700;
      color: #fff;
      font-size: 1.05rem;
      backdrop-filter: blur(8px);
      transition: all 0.3s ease;
    }
    .timer-badge.danger {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
      animation: pulse 1s infinite alternate;
    }
    @keyframes pulse {
      from { transform: scale(1); }
      to { transform: scale(1.04); }
    }
  `]
})
export class QuizTimerComponent implements OnInit, OnDestroy {
  @Input() durationMinutes: number = 60;
  @Input() startedAt!: string | Date;
  @Output() timeout = new EventEmitter<void>();

  secondsLeft = signal<number>(3600);
  isTimeLow = computed(() => this.secondsLeft() < 60); // under 1 minute left

  private timerInterval: any;

  formattedTime = computed(() => {
    const total = this.secondsLeft();
    if (total <= 0) return '00:00';
    
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  });

  ngOnInit() {
    this.calculateRemaining();
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private calculateRemaining() {
    const start = new Date(this.startedAt).getTime();
    const end = start + this.durationMinutes * 60 * 1000;
    const now = new Date().getTime();
    const diffSeconds = Math.max(0, Math.floor((end - now) / 1000));
    this.secondsLeft.set(diffSeconds);

    if (diffSeconds <= 0) {
      this.timeout.emit();
    }
  }

  private tick() {
    this.secondsLeft.update((val) => {
      if (val <= 1) {
        clearInterval(this.timerInterval);
        this.timeout.emit();
        return 0;
      }
      return val - 1;
    });
  }
}
