import { Injectable } from '@nestjs/common';
import {CalculateMortgageDto} from "./dto/calculate-mortgage.dto";
import {MortgageResultDto} from "./dto/mortgage-result.dto";

@Injectable()
export class MortgageService {
    private readonly hundredPercent: number = 100
    private readonly year: number = 12

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
        }
        else {
            monthlyPayment = mortgageAmount / amountOfPayments
        }
        return monthlyPayment;
    }

    public calculateMortgage(dto: CalculateMortgageDto): MortgageResultDto {
        const monthlyPayment: number = this.calcMonthlyPayment(dto.interestRate, dto.mortgageAmount, dto.mortgageTermMonths);
        const totalDebt: number = this.calcTotalDebt(monthlyPayment, dto.mortgageTermMonths);
        const overPayment: number = this.calcOverPayment(totalDebt, dto.mortgageAmount)
        return new MortgageResultDto(monthlyPayment, totalDebt, overPayment);
    }
}
