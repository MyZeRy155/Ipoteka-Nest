import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { ResilientHttpService } from '../common/resilient-http/resilient-http.service';
import { ParseService } from '../parser/parse-currency-rate.cbrf';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let configService: { get: jest.Mock };
  let cacheManager: { get: jest.Mock; set: jest.Mock };
  let resilientHttpService: { fetchWithRetry: jest.Mock };
  let parseService: { parseCbRFCurrencyRate: jest.Mock };

  beforeEach(async () => {
    resilientHttpService = { fetchWithRetry: jest.fn() };
    parseService = { parseCbRFCurrencyRate: jest.fn() };
    configService = { get: jest.fn() };
    cacheManager = { get: jest.fn(), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: ResilientHttpService, useValue: resilientHttpService },
        { provide: ParseService, useValue: parseService },
        { provide: ConfigService, useValue: configService },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('Возвращает данные из кэша, без обращения к внешнему API', async () => {
    const cachedData = { conversion_rates: { USD: 1 } };
    cacheManager.get.mockResolvedValue(cachedData);

    const result = await service.getExchangeCurrencyRate('USD');

    expect(result).toEqual(cachedData);
    expect(resilientHttpService.fetchWithRetry).not.toHaveBeenCalled();
  });

  it('Получает данные с внешнего API и кладет их в кэш', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    configService.get.mockReturnValue('dummy');
    resilientHttpService.fetchWithRetry.mockReturnValue({
      data: { base_code: 'USD', conversion_rates: { USD: 1, EUR: 0.9 } },
    });

    const result = await service.getExchangeCurrencyRate('USD');

    expect(result).toEqual({
      baseCurrency: 'USD',
      rates: { USD: 1, EUR: 0.9 },
      source: 'Exchange_API',
      fetchedAt: expect.any(Date),
    });
    expect(cacheManager.set).toHaveBeenCalledWith(
      'currency-USD',
      result,
      'dummy',
    );
    expect(resilientHttpService.fetchWithRetry).toHaveBeenCalledTimes(1);
  });

  it('Бросает ServiceUnavailableException, когда все попытки исчерпаны', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    configService.get.mockReturnValue('dummy');
    resilientHttpService.fetchWithRetry.mockReturnValue(
      new Error('network error'),
    );

    await expect(service.getExchangeCurrencyRate('USD')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(parseService.parseCbRFCurrencyRate).not.toHaveBeenCalled();
  });

  it('бросает ServiceUnavailableException при невалидном ответе API', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    configService.get.mockReturnValue('dummy');
    resilientHttpService.fetchWithRetry.mockReturnValue({
      data: { foo: 'bar' },
    });

    await expect(service.getExchangeCurrencyRate('USD')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('При недоступности primary для RUB переключается на парсер ЦБ РФ', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    configService.get.mockReturnValue('dummy');
    resilientHttpService.fetchWithRetry.mockReturnValue(
      new Error('network error'),
    );
    parseService.parseCbRFCurrencyRate.mockReturnValue({
      USD: 90,
      EUR: 100,
    });
    const result = await service.getExchangeCurrencyRate('RUB');

    expect(result).toEqual({
      baseCurrency: 'RUB',
      rates: { USD: 1 / 90, EUR: 1 / 100, RUB: 1 },
      source: 'Parser-CBRF',
      fetchedAt: expect.any(Date),
    });
    expect(cacheManager.set).toHaveBeenCalledWith(
      'currency-RUB',
      result,
      'dummy',
    );
  });
  it('Бросает единую ServiceUnavailableException, если и primary, и fallback недоступны', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    configService.get.mockReturnValue('dummy');
    resilientHttpService.fetchWithRetry.mockReturnValue(
      new Error('network error'),
    );
    parseService.parseCbRFCurrencyRate.mockRejectedValue(
      new Error('parser error'),
    );

    await expect(service.getExchangeCurrencyRate('RUB')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
