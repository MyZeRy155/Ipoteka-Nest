import { CurrencyRatesDto } from './dto/currency-rates.dto';
import { AxiosResponse } from 'axios';

export function apiMapper(response: AxiosResponse<any>): CurrencyRatesDto {
  return {
    baseCurrency: response.data.base_code,
    rates: response.data.conversion_rates,
    source: 'Exchange_API',
    fetchedAt: new Date(),
  };
}
export function parserMapper(
  cbRfRates: Record<string, number>,
): CurrencyRatesDto {
  const rates = Object.fromEntries(
    Object.entries(cbRfRates).map(([code, rubPerUnit]) => [
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
  };
}
