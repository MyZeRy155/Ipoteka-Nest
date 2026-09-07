import { Injectable, NotFoundException } from '@nestjs/common';
import { CalculateMortgageDto } from './dto/calculate-mortgage.dto';
import MortgageRecordResultDto from './dto/mortgage-result.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Calculation } from './entities/calculation';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { GetCalculationsQueryDto } from './dto/get-calculations-query.dto';
import { paginate } from '../common/paginate';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.enum';

type Requester = { sub: number; role: Role };

@Injectable()
export class MortgageService {
  private readonly hundredPercent: number = 100;
  private readonly year: number = 12;

  constructor(
    @InjectRepository(Calculation)
    private readonly calculationRepository: Repository<Calculation>,
  ) {}

  private calcTotalDebt(monthlyPayment: number, mortgageTerm: number): number {
    return monthlyPayment * mortgageTerm;
  }

  private calcOverPayment(totalDebt: number, mortgageAmount: number): number {
    return totalDebt - mortgageAmount;
  }

  private calcMonthlyPayment(
    interestRate: number,
    mortgageAmount: number,
    mortgageTerm: number,
  ): number {
    const monthlyRate: number = interestRate / this.hundredPercent / this.year;

    let monthlyPayment: number;

    const amountOfPayments = mortgageTerm;

    if (monthlyRate > 0) {
      monthlyPayment =
        (mortgageAmount * monthlyRate * (1 + monthlyRate) ** amountOfPayments) /
        ((1 + monthlyRate) ** amountOfPayments - 1);
    } else {
      monthlyPayment = mortgageAmount / amountOfPayments;
    }
    return monthlyPayment;
  }

  public async calculateMortgage(
    dto: CalculateMortgageDto,
    userId: number,
  ): Promise<MortgageRecordResultDto> {
    const monthlyPayment: number = this.calcMonthlyPayment(
      dto.interestRate,
      dto.mortgageAmount,
      dto.mortgageTermMonths,
    );
    const totalDebt: number = this.calcTotalDebt(
      monthlyPayment,
      dto.mortgageTermMonths,
    );
    const overPayment: number = this.calcOverPayment(
      totalDebt,
      dto.mortgageAmount,
    );
    const savedCalculation = await this.calculationRepository.save({
      user: { id: userId } as User,
      interestRate: dto.interestRate,
      mortgageAmount: dto.mortgageAmount,
      mortgageTermMonths: dto.mortgageTermMonths,
      monthlyPayment: monthlyPayment,
      totalDebt: totalDebt,
      overPayment: overPayment,
    });
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

  public async getAllCalcRecords(
    query: GetCalculationsQueryDto,
    requester: Requester,
  ): Promise<MortgageRecordResultDto[]> {
    const where: FindOptionsWhere<Calculation> = {
      interestRate: Between(query.minInterestRate, query.maxInterestRate),
    };
    if (requester.role !== Role.Admin) {
      where.user = { id: requester.sub };
    }

    const records = await this.calculationRepository.find({
      order: { id: 'ASC' },
      where,
      ...paginate(query.page, query.limit),
    });

    return records.map(
      (calculation: Calculation) =>
        new MortgageRecordResultDto(
          calculation.interestRate,
          calculation.mortgageAmount,
          calculation.mortgageTermMonths,
          calculation.monthlyPayment,
          calculation.totalDebt,
          calculation.overPayment,
          calculation.id,
        ),
    );
  }

  public async getOneCalcRecord(
    id: number,
    requester: Requester,
  ): Promise<MortgageRecordResultDto> {
    const record = await this.calculationRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (
      !record ||
      (requester.role !== Role.Admin && record.user.id !== requester.sub)
    ) {
      throw new NotFoundException(`Calculation with id ${id} not found`);
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
  public async deleteOneCalcRecord(
    id: number,
    requester: Requester,
  ): Promise<void> {
    const record = await this.calculationRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (
      !record ||
      (requester.role !== Role.Admin && record.user.id !== requester.sub)
    ) {
      throw new NotFoundException(`Calculation with id ${id} not found`);
    }
    await this.calculationRepository.delete({ id: id });
  }
}
