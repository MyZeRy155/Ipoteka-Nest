import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { AuditLog } from './entities/audit-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor';
import { WhitelistModule } from '../whitelist/whitelist.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), GeoModule, WhitelistModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AuditModule {}
