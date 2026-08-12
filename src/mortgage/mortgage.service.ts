import {Injectable, NotFoundException} from '@nestjs/common';
import {CalculateMortgageDto} from "./dto/calculate-mortgage.dto";
import {MortgageRecordResultDto} from "./dto/mortgage-result.dto";
import {InjectRepository} from "@nestjs/typeorm";
import {Calculation} from "./entities/calculation";
import {Repository} from "typeorm";

@Injectable()
export class MortgageService {
    private readonly hundredPercent: number = 100
    private readonly year: number = 12

    constructor(
        @InjectRepository(Calculation) private readonly calculationRepository: Repository<Calculation>,
    ) {
    }

    private calcTotalDebt(monthlyPayment: number, mortgageTerm: number): number {
        return monthlyPayment * mortgageTerm
    }

    private calcOverPayment(totalDebt: number, mortgageAmount: number): number {
        return totalDebt - mortgageAmount
    }

    private calcMonthlyPayment(interestRate: number, mortgageAmount: number, mortgageTerm: number): number {
        const monthlyRate: number = interestRate / this.hundredPercent / this.year;

        let monthlyPayment: number

        const amountOfPayments = mortgageTerm

        if (monthlyRate > 0) {
            monthlyPayment = (mortgageAmount * monthlyRate * (1 + monthlyRate) ** amountOfPayments) / ((1 + monthlyRate) ** amountOfPayments - 1)
        } else {
            monthlyPayment = mortgageAmount / amountOfPayments
        }
        return monthlyPayment;
    }

    public async calculateMortgage(dto: CalculateMortgageDto): Promise<MortgageRecordResultDto> {
        const monthlyPayment: number = this.calcMonthlyPayment(dto.interestRate, dto.mortgageAmount, dto.mortgageTermMonths);
        const totalDebt: number = this.calcTotalDebt(monthlyPayment, dto.mortgageTermMonths);
        const overPayment: number = this.calcOverPayment(totalDebt, dto.mortgageAmount)
        const savedCalculation = await this.calculationRepository.save({
            interestRate: dto.interestRate,
            mortgageAmount: dto.mortgageAmount,
            mortgageTermMonths: dto.mortgageTermMonths,
            monthlyPayment: monthlyPayment,
            totalDebt: totalDebt,
            overPayment: overPayment
        })
        return new MortgageRecordResultDto(
            dto.interestRate,
            dto.mortgageAmount,
            dto.mortgageTermMonths,
            monthlyPayment,
            totalDebt,
            overPayment,
            savedCalculation.id,
        );
    }

    public async getAllCalcRecords(): Promise<MortgageRecordResultDto[]> {
        const records = await this.calculationRepository.find();

        return records.map((calculation: Calculation) => new MortgageRecordResultDto(
            calculation.interestRate,
            calculation.mortgageAmount,
            calculation.mortgageTermMonths,
            calculation.monthlyPayment,
            calculation.totalDebt,
            calculation.overPayment,
            calculation.id
        ));
    }

    public async getOneCalcRecord(id: string): Promise<MortgageRecordResultDto> {
        const record = await this.calculationRepository.findOneBy({id: Number(id)});
        if (!record) {
            throw new NotFoundException(`Calculation with id ${id} not found`)
        }
        return new MortgageRecordResultDto(
            record.interestRate,
            record.mortgageAmount,
            record.mortgageTermMonths,
            record.monthlyPayment,
            record.totalDebt,
            record.overPayment,
            record.id,
        );
    }
    public async deleteOneCalcRecord(id: string): Promise<MortgageRecordResultDto> {
        const record = await this.calculationRepository.findOneBy({id: Number(id)});
        if (!record) {throw new NotFoundException(`Calculation with id ${id} not found`)}

        await this.calculationRepository.delete({id: Number(id)});
        return new MortgageRecordResultDto(
            record.interestRate,
            record.mortgageAmount,
            record.mortgageTermMonths,
            record.monthlyPayment,
            record.totalDebt,
            record.overPayment,
            record.id,
        );
    }
}
