import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { QuizEntity } from './quiz.entity';
import { AssignmentSubmissionEntity } from './assignment-submission.entity';
import { AssignmentEntity } from './assignment.entity';

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  courseId: string; // e.g. 'CS-101' or '412'

  @Column()
  courseName: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ default: 'Active' })
  status: string; // 'Active' or 'Inactive'

  @OneToMany(() => QuizEntity, (quiz) => quiz.course, { cascade: true })
  quizzes: QuizEntity[];

  @OneToMany(() => AssignmentSubmissionEntity, (sub) => sub.course, { cascade: true })
  submissions: AssignmentSubmissionEntity[];

  @OneToMany(() => AssignmentEntity, (assignment) => assignment.course, { cascade: true })
  assignments: AssignmentEntity[];
}
