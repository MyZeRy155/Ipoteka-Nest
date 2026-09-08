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
    example: '203.0.113.10',
    description:
      'Доверенный IP-адрес, IPv4 или IPv6. Сравнение точное, диапазоны и маски (CIDR) не поддерживаются',
  })
  @IsIP()
  @IsNotEmpty()
  ipAddress: string;

  @ApiPropertyOptional({
    example: 'офис, статический',
    maxLength: 255,
    description:
      'Произвольная пометка для людей — откуда этот адрес и кому принадлежит. На логику не влияет',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;
}
