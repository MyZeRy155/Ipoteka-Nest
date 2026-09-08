import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTrustedLocation } from './entities/user-trusted-location';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserTrustedLocation]), GeoModule],
  controllers: [],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
