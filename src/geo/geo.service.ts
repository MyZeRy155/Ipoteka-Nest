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
      this.logger.error(`Не удалось получить геоданные для IP ${ip}`, error);
      return { countryCode: 'UNKNOWN', city: 'Unknown', isFallback: true };
    }
  }
}
