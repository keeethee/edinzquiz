import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { QuizSubmissionEntity } from './quiz-submission.entity';
import { QuestionEntity } from './question.entity';
import { OptionEntity } from './option.entity';

@Entity('student_answers')
export class StudentAnswerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'text', nullable: true })
  typedAnswerText: string | null; // Used for FillBlank and Subjective typed answers

  @Column({ type: 'float', nullable: true })
  awardedMarks: number | null; // Null represents 'Pending Evaluation' (for Subjective items)

  @Index()
  @ManyToOne(() => QuizSubmissionEntity, (sub) => sub.studentAnswers, { onDelete: 'CASCADE' })
  submission: QuizSubmissionEntity;

  @Index()
  @ManyToOne(() => QuestionEntity, (q) => q.studentAnswers, { onDelete: 'CASCADE' })
  question: QuestionEntity;

  @ManyToOne(() => OptionEntity, (opt) => opt.studentAnswers, { onDelete: 'CASCADE', nullable: true })
  selectedOption: OptionEntity | null;
}
