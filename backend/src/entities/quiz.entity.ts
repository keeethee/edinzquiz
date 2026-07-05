import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, Index } from 'typeorm';
import { CourseEntity } from './course.entity';
import { QuestionEntity } from './question.entity';
import { QuizSubmissionEntity } from './quiz-submission.entity';
import { CategoryEntity } from './category.entity';
import { QuizSettingsEntity } from './quiz-settings.entity';

@Entity('quizzes')
export class QuizEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quizTitle: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 'Medium' })
  difficulty: string; // 'Easy' | 'Medium' | 'Hard'

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ default: 'Draft' })
  status: string; // 'Draft' | 'Published' | 'Archived'

  @Column({ default: 100 })
  totalMarks: number;

  @Column({ default: 60 })
  duration: number; // in minutes

  @Column({ default: 40 })
  passingMarks: number;

  @Column({ default: false })
  negativeMarkingEnabled: boolean;

  @Column({ type: 'float', default: 0 })
  negativeMarkingValue: number; // e.g. 0.25

  @Column({ default: false })
  shuffleQuestions: boolean;

  @Column({ default: false })
  shuffleOptions: boolean;

  @Column({ default: false })
  resultsPublished: boolean;

  @Index()
  @ManyToOne(() => CourseEntity, (course) => course.quizzes, { onDelete: 'CASCADE' })
  course: CourseEntity;

  @Index()
  @ManyToOne(() => CategoryEntity, (cat) => cat.quizzes, { nullable: true, onDelete: 'SET NULL', eager: true })
  category: CategoryEntity | null;

  @OneToOne(() => QuizSettingsEntity, (settings) => settings.quiz, { cascade: true, eager: true })
  settings: QuizSettingsEntity;

  @OneToMany(() => QuestionEntity, (q) => q.quiz, { cascade: true })
  questions: QuestionEntity[];

  @OneToMany(() => QuizSubmissionEntity, (sub) => sub.quiz, { cascade: true })
  submissions: QuizSubmissionEntity[];
}
