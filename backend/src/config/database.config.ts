import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'better-sqlite3',
  database: 'edinz_quiz.sqlite',
  autoLoadEntities: true,
  synchronize: true,
}));
