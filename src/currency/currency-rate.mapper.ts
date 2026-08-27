import { CurrencyRatesDto } from './dto/currency-rates.dto';
import { AxiosResponse } from 'axios';

export interface ExchangeRateApiResponse {
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
}

export function apiMapper(response: AxiosResponse<any>): CurrencyRatesDto {
  return {
    baseCurrency: response.data.base_code,
    rates: response.data.conversion_rates,
    source: 'Exchange_API',
    fetchedAt: new Date(),
    sourceUpdatedAt: new Date(response.data.time_last_update_unix * 1000),
  };
}
export function parserMapper(cbRfRates: {
  rates: Record<string, number>;
  updatedAt: Date;
}): CurrencyRatesDto {
  const rates = Object.fromEntries(
    Object.entries(cbRfRates.rates).map(([code, rubPerUnit]) => [
      code,
      1 / rubPerUnit,
    ]),
  );
  rates.RUB = 1;

  return {
    baseCurrency: 'RUB',
    rates,
    source: 'Parser-CBRF',
    fetchedAt: new Date(),
    sourceUpdatedAt: cbRfRates.updatedAt,
  };
}
