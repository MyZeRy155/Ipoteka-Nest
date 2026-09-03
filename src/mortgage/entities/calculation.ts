import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Calculation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column('int')
  mortgageTermMonths: number;
  @Column('double precision')
  interestRate: number;
  @Column('double precision')
  mortgageAmount: number;
  @Column('double precision')
  monthlyPayment: number;
  @Column('double precision')
  totalDebt: number;
  @Column('double precision')
  overPayment: number;
}
