import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.enum';
import { UserStatus } from './status.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', default: Role.User })
  role: Role;

  @Column({ type: 'varchar', default: UserStatus.Active })
  status: UserStatus;

  @Index({ unique: true })
  @Column('varchar', { length: 255 })
  username: string;

  @Column('varchar', { length: 255 })
  hashedPassword: string;

  @Column('varchar', { length: 255, nullable: true })
  hashedRefreshToken: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
