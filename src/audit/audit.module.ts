import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { AuditLog } from './entities/audit-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), GeoModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AuditModule {}
