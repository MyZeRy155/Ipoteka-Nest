import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIP,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWhitelistIpDto {
  @ApiProperty({
    example: '203.0.113.10'
  })
  @IsIP()
  @IsNotEmpty()
  ipAddress: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;
}