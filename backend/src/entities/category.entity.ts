import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { QuizEntity } from './quiz.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => QuizEntity, (quiz) => quiz.category)
  quizzes: QuizEntity[];
}
