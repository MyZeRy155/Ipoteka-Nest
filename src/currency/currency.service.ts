import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ResilientHttpService } from '../common/resilient-http/resilient-http.service';
import { ParseService } from '../parser/parse-currency-rate.cbrf';
import { apiMapper, parserMapper } from './currency-rate.mapper';
import { CurrencyRatesDto } from './dto/currency-rates.dto';

@Injectable()
export class CurrencyService {
  constructor(
    private configService: ConfigService,
    private resilientHttpSerivce: ResilientHttpService,
    private parseService: ParseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getExchangeCurrencyRate(currency: string): Promise<CurrencyRatesDto> {
    const key = `currency-${currency}`;
    const cached = await this.cacheManager.get<CurrencyRatesDto>(key);
    if (cached) {
      return cached;
    } else {
      const url =
        this.configService.get('EXCHANGERATE_API_BASE_URL') +
        this.configService.get('EXCHANGERATE_API_KEY') +
        '/latest/' +
        currency;
      try {
        const response = await this.resilientHttpSerivce.fetchWithRetry(url, 4);
        if (
          !response.data ||
          typeof response.data.conversion_rates !== 'object'
        ) {
          throw new Error('Получен некорректный ответ от API');
        }
        const result = apiMapper(response);
        await this.cacheManager.set(
          key,
          result,
          this.configService.get('REDIS_CACHE_TTL'),
        );
        return result;
      } catch (error) {
        if (currency === 'RUB') {
          try {
            const cbrfRates = await this.parseService.parseCbRFCurrencyRate();
            const result = parserMapper(cbrfRates);
            await this.cacheManager.set(
              key,
              result,
              this.configService.get('REDIS_CACHE_TTL'),
            );
            return result;
          } catch (fallbackError) {
            throw new ServiceUnavailableException(
              'Не удалось получить данные: источник недоступен',
              { cause: fallbackError },
            );
          }
        }
        throw new ServiceUnavailableException(
          'Не удалось получить данные: источник недоступен',
          { cause: error },
        );
      }
    }
  }
}
