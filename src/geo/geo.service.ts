import { ConfigService } from '@nestjs/config';
import { ResilientHttpService } from '../common/resilient-http/resilient-http.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { GeoLocationDto } from './dto/geo-location.dto';
import { geoMapper, IpapiResponse } from './geo-location.mapper';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly resilientHttpService: ResilientHttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async getGeoLocation(ip: string): Promise<GeoLocationDto> {
    if (this.isNonPublicIp(ip)) {
      return this.fallback();
    }
    const key = 'geo-' + ip;
    const cached = await this.cacheManager.get<GeoLocationDto>(key);
    if (cached) {
      return cached;
    }
    const url = `${this.configService.get('GEO_API_BASE_URL')}/${ip}/json/`;
    try {
      const response =
        await this.resilientHttpService.fetchWithRetry<IpapiResponse>(url, 4);
      if (response.data.error) {
        throw new Error(`ipapi.co вернул ошибку: ${response.data.reason}`);
      } else {
        const result = geoMapper(response);
        await this.cacheManager.set(key, result, 1000 * 60 * 60);
        return result;
      }
    } catch (error) {
      this.logger.warn(
        `Не удалось получить геоданные для IP ${ip}: ${error instanceof Error ? error.message : error}`,
      );
      return this.fallback();
    }
  }
  private isNonPublicIp(ip: string): boolean {
    if (!ip || ip === 'unknown') return true;
    return (
      ip === '::1' ||
      ip.startsWith('127.') ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
    );
  }

  private fallback(): GeoLocationDto {
    return { countryCode: 'UNKNOWN', city: 'Unknown', isFallback: true };
  }
}
