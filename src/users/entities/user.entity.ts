import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column('varchar', { length: 255 })
  username: string;

  @Column('varchar', { length: 255 })
  hashedPassword: string;

  @CreateDateColumn()
  createdAt: Date;
}
