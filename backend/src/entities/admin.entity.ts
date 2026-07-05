import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('admins')
export class AdminEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'admin' })
  role: string;
}
