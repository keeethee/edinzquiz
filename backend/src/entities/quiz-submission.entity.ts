import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, Index } from 'typeorm';
import { QuizEntity } from './quiz.entity';
import { StudentAnswerEntity } from './student-answer.entity';
import { StudentEntity } from './student.entity';

@Entity('quiz_submissions')
export class QuizSubmissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentName: string;

  @Column()
  collegeName: string;

  @Column()
  courseId: string; // Course ID code, e.g. 'CS-101'

  @Column()
  courseName: string; // Course Name, e.g. 'Intro to Python'

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column()
  totalMarks: number;

  @Column({ type: 'float', default: 0 })
  percentage: number;

  @Column({ default: 0 })
  correctCount: number;

  @Column({ default: 0 })
  wrongCount: number;

  @Column({ default: 0 })
  unansweredCount: number;

  @Column({ default: 'Pending Evaluation' })
  status: string; // 'Pass' | 'Fail' | 'Pending Evaluation'

  @CreateDateColumn()
  submittedAt: Date;

  @Index()
  @ManyToOne(() => QuizEntity, (quiz) => quiz.submissions, { onDelete: 'CASCADE' })
  quiz: QuizEntity;

  @Index()
  @ManyToOne(() => StudentEntity, (student) => student.submissions, { onDelete: 'SET NULL', nullable: true })
  student: StudentEntity | null;

  @OneToMany(() => StudentAnswerEntity, (ans) => ans.submission, { cascade: true })
  studentAnswers: StudentAnswerEntity[];
}
