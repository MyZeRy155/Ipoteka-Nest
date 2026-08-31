import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { GeoService } from '../geo/geo.service';
import { AuditMeta } from './audit-meta.interface';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';
import { toAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly geoService: GeoService,
  ) {}

  record(meta: AuditMeta): void {
    this.enrichAndSave(meta).catch((err) =>
      this.logger.error('Не удалось записать audit-лог', err),
    );
  }

  private async enrichAndSave(meta: AuditMeta): Promise<void> {
    const geo = await this.geoService.getGeoLocation(meta.ip);
    await this.auditRepo.save(
      this.auditRepo.create({
        userId: meta.userId,
        ipAddress: meta.ip,
        countryCode: geo.countryCode,
        method: meta.method,
        requestedUrl: meta.url,
        statusCode: meta.statusCode,
      }),
    );
  }

  async findAll(query: GetAuditLogsQueryDto) {
    const where: FindOptionsWhere<AuditLog> = {};

    if (query.userId !== undefined) where.userId = query.userId;
    if (query.ipAddress) where.ipAddress = query.ipAddress;
    if (query.statusCode !== undefined) where.statusCode = query.statusCode;
    if (query.method) where.method = query.method;

    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to) where.createdAt = Between(from, to);
    else if (from) where.createdAt = MoreThanOrEqual(from);
    else if (to) where.createdAt = LessThanOrEqual(to);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.auditRepo.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows.map(toAuditLogDto), total, page, limit };
  }
}
