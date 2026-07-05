import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { QuizEntity } from './quiz.entity';

@Entity('quiz_settings')
export class QuizSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1 })
  maxAttempts: number;

  @Column({ default: 40 })
  passingPercentage: number;

  @Column({ default: true })
  showResultsImmediately: boolean;

  @OneToOne(() => QuizEntity, (quiz) => quiz.settings, { onDelete: 'CASCADE' })
  @JoinColumn()
  quiz: QuizEntity;
}
