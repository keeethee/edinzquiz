import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { QuizEntity } from './quiz.entity';
import { OptionEntity } from './option.entity';
import { StudentAnswerEntity } from './student-answer.entity';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ default: 'MCQ' })
  questionType: string; // 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'TF' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'ESSAY'

  @Column({ default: 1 })
  mark: number;

  @Column({ type: 'text', nullable: true })
  correctAnswerText: string | null; // Stores correct answers (e.g., serialized JSON array of accepted blanks)

  @Column({ default: 0 })
  orderIndex: number;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ default: false })
  caseSensitive: boolean;

  @Column({ type: 'text', nullable: true })
  sampleAnswer: string | null;

  @ManyToOne(() => QuizEntity, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  quiz: QuizEntity;

  @OneToMany(() => OptionEntity, (opt) => opt.question, { cascade: true })
  options: OptionEntity[];

  @OneToMany(() => StudentAnswerEntity, (sa) => sa.question, { cascade: true })
  studentAnswers: StudentAnswerEntity[];
}
