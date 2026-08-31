import { ApiProperty } from '@nestjs/swagger';
import { WhiteListIp } from '../entities/whitelist.entity';

export class WhiteListIpDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '203.0.113.10' })
  ipAddress: string;

  @ApiProperty({ nullable: true, example: 'офис, статический' })
  label: string | null;

  @ApiProperty({ example: '2026-08-28T10:00:00.000Z' })
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
