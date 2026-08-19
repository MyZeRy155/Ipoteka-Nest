import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import {HttpService} from "@nestjs/axios";
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import {ConfigService} from "@nestjs/config";
import {of, throwError} from "rxjs";
import {ServiceUnavailableException} from "@nestjs/common";

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpService: {get: jest.Mock};
  let configService: {get: jest.Mock}
  let cacheManager: {get: jest.Mock; set: jest.Mock};

  beforeEach(async () => {
    httpService = { get: jest.fn() }
    configService = { get: jest.fn() }
    cacheManager = { get: jest.fn(), set: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencyService,
        { provide: HttpService,   useValue:  httpService },
        { provide: ConfigService, useValue:  configService},
        { provide: CACHE_MANAGER, useValue:  cacheManager},
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });
  afterEach(() => {
    jest.useRealTimers()
  })

  it('Возвращает данные из кэша, без обращения к внешнему API', async () => {
    const cachedData = { conversion_rates: { USD: 1 }}
    cacheManager.get.mockResolvedValue(cachedData)

    const result = await service.getExchangeCurrencyRate('USD')

    expect(result).toEqual(cachedData);
    expect(httpService.get).not.toHaveBeenCalled();
  });
  it('Получает данные с внешнего API и кладет их в кэш', async () => {
    const apiData = { conversion_rates: { USD: 1, EUR: 0.9}}
    cacheManager.get.mockResolvedValue(undefined)
    configService.get.mockReturnValue('dummy')
    httpService.get.mockReturnValue(of({ data: apiData }))

    const result = await service.getExchangeCurrencyRate('USD')

    expect(result).toEqual(apiData);
    expect(cacheManager.set).toHaveBeenCalledWith('currency-USD', apiData, 'dummy')
    expect(httpService.get).toHaveBeenCalledTimes(1)
  })
  it('Бросает ServiceUnavailableException, когда все попытки исчерпаны', async () =>{
    cacheManager.get.mockResolvedValue(undefined)
    configService.get.mockReturnValue('dummy')
    httpService.get.mockReturnValue(throwError(() => new Error('network error')))

    jest.useFakeTimers();
    const assertion = expect(service.getExchangeCurrencyRate('USD')).rejects.toThrow(ServiceUnavailableException);
    await jest.runAllTimersAsync()

    expect(httpService.get).toHaveBeenCalledTimes(4)



  })
  it('бросает ServiceUnavailableException при невалидном ответе API', async () =>{
    cacheManager.get.mockResolvedValue(undefined)
    configService.get.mockReturnValue('dummy')
    httpService.get.mockReturnValue(of({data: {foo: 'bar'}}))

    await expect(service.getExchangeCurrencyRate('USD')).rejects.toThrow(ServiceUnavailableException)
    expect(cacheManager.set).not.toHaveBeenCalled();
  })

  it('Делает повторные попытки при сбои и в итоге возвращает данные', async () => {
    const apiData = { conversion_rates: { USD: 1 }}
    cacheManager.get.mockResolvedValue(undefined)
    configService.get.mockReturnValue('dummy')
    httpService.get
        .mockReturnValueOnce(throwError(()=> new Error('network error')))
        .mockReturnValueOnce(throwError(()=> new Error('network error')))
        .mockReturnValueOnce(of({data: apiData}))
    const result = await service.getExchangeCurrencyRate('USD')

    expect(result).toEqual(apiData);
    expect(httpService.get).toHaveBeenCalledTimes(3)
  }, 10000)
});
