import { ResilientHttpService } from './resilient-http.service';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

describe('ResilientHttpService', () => {
  let service: ResilientHttpService;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResilientHttpService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get<ResilientHttpService>(ResilientHttpService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Возвращает данные с первой попытки, без повторов', async () => {
    httpService.get.mockReturnValue(of({ data: { foo: 'bar' } }));

    const result = await service.fetchWithRetry('http://example.com', 3);

    expect(result).toEqual({ data: { foo: 'bar' } });
    expect(httpService.get).toHaveBeenCalledTimes(1);
  });

  it('Повторяет запрос после сбоя и возвращает данные при успехе', async () => {
    httpService.get
      .mockReturnValueOnce(throwError(() => new Error('network error')))
      .mockReturnValueOnce(of({ data: { foo: 'bar' } }));

    jest.useFakeTimers();
    const promise = service.fetchWithRetry('http://example.com', 3);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ data: { foo: 'bar' } });
    expect(httpService.get).toHaveBeenCalledTimes(2);
  });

  it('Бросает последнюю ошибку, когда все попытки исчерпаны', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('network error')),
    );

    jest.useFakeTimers();
    const assertion = expect(
      service.fetchWithRetry('http://example.com', 3),
    ).rejects.toThrow('network error');
    await jest.runAllTimersAsync();
    await assertion;

    expect(httpService.get).toHaveBeenCalledTimes(3);
  });
});
