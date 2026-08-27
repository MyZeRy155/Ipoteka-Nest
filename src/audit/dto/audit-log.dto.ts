import { ApiProperty } from '@nestjs/swagger';
import { AuditLog } from '../entities/audit-log.entity';

export class AuditLogDto {
  @ApiProperty({
    example: 1024,
    description: 'Идентификатор записи журнала',
  })
  id: number;

  @ApiProperty({
    nullable: true,
    example: 42,
    description: 'Идентификатор аутентифицированного пользователя',
  })
  userId: number | null;

  @ApiProperty({
    example: '203.0.113.7',
    description: 'IP-адрес клиента',
  })
  ipAddress: string;

  @ApiProperty({
    nullable: true,
    example: 'RU',
    description: 'Код страны по IP',
  })
  countryCode: string | null;

  @ApiProperty({
    example: 'GET',
    description: 'HTTP-метод запроса',
  })
  method: string;

  @ApiProperty({
    example: '/currency/rates?base=USD',
    description: 'Запрошенный путь с query-строкой',
  })
  requestedUrl: string;

  @ApiProperty({
    example: 200,
    description: 'HTTP-статус ответа',
  })
  statusCode: number;

  @ApiProperty({
    example: '2026-08-27T12:34:56.000Z',
    description: 'Момент запроса',
  })
  createdAt: Date;
}

export function toAuditLogDto(entity: AuditLog): AuditLogDto {
  return {
    id: entity.id,
    userId: entity.userId,
    ipAddress: entity.ipAddress,
    countryCode: entity.countryCode,
    method: entity.method,
    requestedUrl: entity.requestedUrl,
    statusCode: entity.statusCode,
    createdAt: entity.createdAt,
  };
}
