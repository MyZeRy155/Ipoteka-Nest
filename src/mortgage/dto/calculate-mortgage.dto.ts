import {ApiProperty} from "@nestjs/swagger";
import {IsNumber, IsPositive, IsInt, Min, Max, IsNotEmpty} from "class-validator";

export class CalculateMortgageDto {

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @Min(0.1)
    @Max(50.0)
    @ApiProperty({example: 12, description: 'Процентная ставка'})
    interestRate: number;

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @Min(1)
    @Max(100000000000)
    @ApiProperty({example: 10000, description: 'Заемная сумма'})
    mortgageAmount: number;

    @IsNotEmpty()
    @IsNumber()


    @IsInt()
    @Min(1)
    @Max(360)
    @ApiProperty({example: 12, description: 'Длительность заема в месяцах'})
    mortgageTermMonths: number;
}
