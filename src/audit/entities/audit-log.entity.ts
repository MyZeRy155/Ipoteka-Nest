import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { nullable: true })
  userId: number | null;

  @Index()
  @Column('varchar', { length: 45 })
  ipAddress: string;

  @Column('varchar', { length: 10, nullable: true })
  countryCode: string | null;

  @Column('varchar', { length: 255 })
  requestedUrl: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
