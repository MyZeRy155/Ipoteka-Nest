import { ApiProperty } from '@nestjs/swagger';

class MortgageRecordResultDto {
  @ApiProperty({
    example: 12,
    description: 'Процентная ставка, под которую был произведён расчёт',
  })
  public interestRate: number;
  @ApiProperty({
    example: 10000,
    description: 'Заёмная сумма, под которую был произведён расчёт',
  })
  public mortgageAmount: number;
  @ApiProperty({
    example: 6,
    description: 'Срок ипотеки в месяцах, под который был произведён расчёт',
  })
  public mortgageTermMonths: number;
  @ApiProperty({ description: 'Рассчитанный ежемесячный платёж' })
  public monthlyPayment: number;
  @ApiProperty({ description: 'Рассчитанная общая сумма выплат за весь срок' })
  public totalDebt: number;
  @ApiProperty({
    description:
      'Рассчитанная переплата (разница между общей суммой выплат и телом займа)',
  })
  public overPayment: number;
  @ApiProperty({
    required: false,
    description:
      'Идентификатор сохранённой записи расчёта в базе данных (отсутствует, если запись ещё не сохранена)',
  })
  public id?: number;
  constructor(
    interestRate: number,
    mortgageAmount: number,
    mortgageTermMonths: number,
    monthlyPayment: number,
    totalDebt: number,
    overPayment: number,
    id?: number,
  ) {
    this.interestRate = interestRate;
    this.mortgageAmount = mortgageAmount;
    this.mortgageTermMonths = mortgageTermMonths;
    this.monthlyPayment = monthlyPayment;
    this.totalDebt = totalDebt;
    this.overPayment = overPayment;
    this.id = id;
  }
}

export default MortgageRecordResultDto;
