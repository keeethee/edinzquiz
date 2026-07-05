import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { QuizSubmissionEntity } from './quiz-submission.entity';

@Entity('students')
export class StudentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column()
  collegeName: string;

  @CreateDateColumn()
  registeredAt: Date;

  @OneToMany(() => QuizSubmissionEntity, (sub) => sub.student, { cascade: true })
  submissions: QuizSubmissionEntity[];
}
