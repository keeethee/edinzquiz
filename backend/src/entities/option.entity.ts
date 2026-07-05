import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { QuestionEntity } from './question.entity';
import { StudentAnswerEntity } from './student-answer.entity';

@Entity('options')
export class OptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  optionText: string;

  @Column({ default: false })
  isCorrect: boolean;

  @ManyToOne(() => QuestionEntity, (q) => q.options, { onDelete: 'CASCADE' })
  question: QuestionEntity;

  @OneToMany(() => StudentAnswerEntity, (sa) => sa.selectedOption)
  studentAnswers: StudentAnswerEntity[];
}
