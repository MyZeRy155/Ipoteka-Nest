import {ApiProperty} from "@nestjs/swagger";

export class CalculateMortgageDto {
    @ApiProperty({example: 12, description: 'Процентная ставка'})
    interestRate: number;
    @ApiProperty({example: 10000, description: 'Заемная сумма'})
    mortgageAmount: number;
    @ApiProperty({example: 12, description: 'Длительность заема в месяцах'})
    mortgageTermMonths: number;
}
