import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuditService } from './audit.service';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';
import { AuditLogDto } from './dto/audit-log.dto';

@ApiTags('audit')
@Controller('audit')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiExtraModels(AuditLogDto)
@ApiUnauthorizedResponse({
  description: 'Токен отсутствует или недействителен',
})
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Журнал аудита: список запросов с пагинацией и фильтрами',
    description:
      'Журнал наполняется автоматически: каждый обработанный запрос записывается вместе с IP, страной по IP, ' +
      'методом, путём, кодом ответа и признаком доверенного адреса. Запись выполняется в фоне и не задерживает ' +
      'ответ клиенту, поэтому свежее событие может появиться в журнале с небольшой задержкой. Отказы на уровне ' +
      'guard (401 и 403) в журнал не попадают.',
  })
  @ApiOkResponse({
    description: 'Страница журнала',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(AuditLogDto) },
        },
        total: { type: 'number', example: 1024 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
  })
  findAll(@Query() query: GetAuditLogsQueryDto) {
    return this.auditService.findAll(query);
  }
}
