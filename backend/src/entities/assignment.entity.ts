import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CourseEntity } from './course.entity';

@Entity('assignments')
export class AssignmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  deadline: Date;

  @ManyToOne(() => CourseEntity, (course) => course.assignments, { onDelete: 'CASCADE' })
  course: CourseEntity;
}
