import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class WhiteListIp {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column('varchar', { length: 45 })
  ipAddress: string;

  @Column('varchar', { length: 255, nullable: true })
  label: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
