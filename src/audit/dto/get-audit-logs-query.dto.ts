import {
  IsDateString,
  IsIn,
  IsInt,
  IsIP,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class GetAuditLogsQueryDto extends PaginationQueryDto {
  @ApiProperty({
    required: false,
    example: 42,
    description: 'Фильтр по идентификатору пользователя',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiProperty({
    required: false,
    example: '203.0.113.7',
    description: 'Фильтр по IP-адресу клиента',
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiProperty({
    required: false,
    example: 403,
    description: 'Фильтр по HTTP-статусу ответа',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(599)
  statusCode?: number;

  @ApiProperty({
    required: false,
    example: 'GET',
    description: 'Фильтр по HTTP-методу',
  })
  @IsOptional()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method?: string;

  @ApiProperty({
    required: false,
    example: '2026-07-30T00:00:00Z',
    description: 'Начало диапозона по времени',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    required: false,
    example: '2026-08-01T00:00:00Z',
    description: 'Конец диапозона по времени',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
