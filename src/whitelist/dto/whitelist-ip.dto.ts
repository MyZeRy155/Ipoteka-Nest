import { ApiProperty } from '@nestjs/swagger';
import { WhiteListIp } from '../entities/whitelist.entity';

export class WhiteListIpDto {
  @ApiProperty({ example: 1, description: 'Идентификатор записи' })
  id: number;

  @ApiProperty({
    example: '203.0.113.10',
    description: 'Доверенный IP-адрес',
  })
  ipAddress: string;

  @ApiProperty({
    nullable: true,
    example: 'офис, статический',
    description: 'Пометка для людей, может отсутствовать',
  })
  label: string | null;

  @ApiProperty({
    example: '2026-08-28T10:00:00.000Z',
    description: 'Момент добавления записи в список',
  })
  createdAt: Date;
}

export function toWhiteListIpDto(row: WhiteListIp): WhiteListIpDto {
  return {
    id: row.id,
    ipAddress: row.ipAddress,
    label: row.label,
    createdAt: row.createdAt,
  };
}
