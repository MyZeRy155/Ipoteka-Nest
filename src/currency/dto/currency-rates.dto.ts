export interface CurrencyRatesDto {
  baseCurrency: string;
  rates: Record<string, number>;
  source: 'Exchange_API' | 'Parser-CBRF';
  fetchedAt: Date;
  sourceUpdatedAt: Date;
}
