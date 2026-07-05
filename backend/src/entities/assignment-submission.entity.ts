import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { CourseEntity } from './course.entity';

@Entity('assignment_submissions')
export class AssignmentSubmissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentName: string;

  @Column()
  collegeName: string;

  @Column()
  courseName: string; // Course name copied at submission

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ nullable: true, type: 'int' })
  marks: number | null; // Grade marks (0-100)

  @Column({ nullable: true, type: 'text' })
  feedback: string | null;

  @ManyToOne(() => CourseEntity, (course) => course.submissions, { onDelete: 'CASCADE' })
  course: CourseEntity;
}
