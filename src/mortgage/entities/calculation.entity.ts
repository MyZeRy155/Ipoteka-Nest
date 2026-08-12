import {PrimaryGeneratedColumn, Column, Entity} from "typeorm";

@Entity()
export class CalculationEntity {
    @PrimaryGeneratedColumn()
    id: number;
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