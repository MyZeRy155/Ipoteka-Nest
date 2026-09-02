import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuditService } from './audit.service';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';

@ApiTags('audit')
@Controller('audit')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Журнал аудита: список запросов с пагинацией и фильтрами',
  })
  findAll(@Query() query: GetAuditLogsQueryDto) {
    return this.auditService.findAll(query);
  }
}
