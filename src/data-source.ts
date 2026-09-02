import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Calculation } from './mortgage/entities/calculation';
import { AuditLog } from './audit/entities/audit-log.entity';
import { WhiteListIp } from './whitelist/entities/whitelist.entity';
import { User } from './users/entities/user.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Calculation, AuditLog, WhiteListIp, User],
  migrations: ['src/migrations/*.ts'],
});
