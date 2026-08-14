import {IsInt, IsNumber, IsOptional, Max, Min} from "class-validator";
import {Type} from "class-transformer";
import {ApiProperty} from "@nestjs/swagger";

export class GetCalculationsQueryDto {

    @ApiProperty({ required: false, example: 1, description: 'Номер страницы (начиная с 1). По умолчанию — 1'
    })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiProperty({ required: false, example: 10, description: 'Количество записей на странице (максимум 10). По умолчанию — 10' })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    limit: number = 10;

    @ApiProperty({ required: false, example: 5, description: 'Нижняя граница фильтра по процентной ставке. По умолчанию — 0.1' })
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0.1)
    @Max(50.0)
    minInterestRate: number = 0.1;

    @ApiProperty({ required: false, example: 20, description: 'Верхняя граница фильтра по процентной ставке. По умолчанию — 50' })
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0.1)
    @Max(50.0)
    maxInterestRate: number = 50.0;
}