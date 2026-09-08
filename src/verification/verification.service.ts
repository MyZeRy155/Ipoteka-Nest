import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { UserTrustedLocation } from './entities/user-trusted-location';
import { GeoService } from '../geo/geo.service';
import { getClientIp } from '../common/get-client-ip';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';

export interface VerificationRequest {
  request: Request;
  reason: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  constructor(
    @InjectRepository(UserTrustedLocation)
    private readonly repo: Repository<UserTrustedLocation>,
    private readonly geoService: GeoService,
  ) {}

  async requireVerification({
    request,
    reason,
  }: VerificationRequest): Promise<void> {
    this.logger.debug(`Step-up не выполнен, является заглушкой: ${reason}`);
  }

  async verifyLoginLocation(user: User, request: Request): Promise<void> {
    const geo = await this.geoService.getGeoLocation(getClientIp(request));
    if (geo.isFallback) return;
    if (await this.isKnownCity(user.id, geo.city)) return;
    await this.requireVerification({
      request,
      reason: 'login-from-new-location',
    });
    await this.addCity(user.id, geo.city);
  }

  async recordLocation(user: User, request: Request): Promise<void> {
    const geo = await this.geoService.getGeoLocation(getClientIp(request));
    if (geo.isFallback) return;
    if (await this.isKnownCity(user.id, geo.city)) return;
    await this.addCity(user.id, geo.city);
  }

  private async isKnownCity(userId: number, city: string): Promise<boolean> {
    return this.repo.existsBy({ user: { id: userId } as User, city });
  }

  private async addCity(userId: number, city: string): Promise<void> {
    await this.repo.save(this.repo.create({ user: { id: userId }, city }));
  }
}
