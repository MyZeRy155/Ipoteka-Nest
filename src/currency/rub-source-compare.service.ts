import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResilientHttpService } from '../common/resilient-http/resilient-http.service';
import { ParseService } from '../parser/parse-currency-rate.cbrf';
import { apiMapper, parserMapper } from './currency-rate.mapper';
import {
  CompareReport,
  compareSources,
  resolveSource,
  Sources,
} from '../common/resolve-source';
import { CurrencyRatesDto } from './dto/currency-rates.dto';

@Injectable()
export class RubSourceCompareService {
  constructor(
    private readonly configService: ConfigService,
    private readonly resilientHttpService: ResilientHttpService,
    private readonly parseService: ParseService,
  ) {}

  async compare(): Promise<CompareReport<CurrencyRatesDto>> {
    const url =
      this.configService.get('EXCHANGERATE_API_BASE_URL') +
      this.configService.get('EXCHANGERATE_API_KEY') +
      '/latest/RUB';

    const [primarySettled, fallbackSettled] = await Promise.allSettled([
      this.resilientHttpService.fetchWithRetry<any>(url, 4).then(apiMapper),
      this.parseService.parseCbRFCurrencyRate().then(parserMapper),
    ]);

    const x = resolveSource(Sources.exchangeRateAPI, primarySettled);
    const y = resolveSource(Sources.cbRF, fallbackSettled);

    return compareSources(x, y);
  }
}
