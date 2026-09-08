import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrencyService } from './currency.service';
import { CurrencyHealthService } from './currency-health.service';
import { RubSourceCompareService } from './rub-source-compare.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('currency')
@Controller('currency')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Токен отсутствует или недействителен',
})
export class CurrencyController {
  constructor(
    private readonly currencyService: CurrencyService,
    private readonly currencyHealthService: CurrencyHealthService,
    private readonly rubSourceCompareService: RubSourceCompareService,
  ) {}

  @ApiOperation({
    summary: 'Курсы валют к указанной базовой валюте',
    description:
      'Ответ кэшируется в Redis, поэтому повторные запросы за тот же период не идут во внешний источник. ' +
      'Запрос к источнику выполняется с таймаутом и повторными попытками с экспоненциальной задержкой. ' +
      'Для RUB при отказе основного источника используется резервный — парсер cbr.ru; для остальных валют ' +
      'резерва нет. Если данных не удалось получить нигде, возвращается 503, а не 500 — это отличает ' +
      'временную недоступность внешнего сервиса от ошибки самого приложения.',
  })
  @ApiParam({
    name: 'currency',
    example: 'USD',
    description: 'Код базовой валюты в формате ISO 4217',
  })
  @ApiOkResponse({
    description: 'Курсы валют и сведения об источнике данных',
    schema: {
      type: 'object',
      properties: {
        baseCurrency: { type: 'string', example: 'USD' },
        rates: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { RUB: 92.5, EUR: 0.92 },
        },
        source: {
          type: 'string',
          enum: ['Exchange_API', 'Parser-CBRF'],
          description: 'Источник, который в итоге отдал данные',
        },
        fetchedAt: { type: 'string', format: 'date-time' },
        sourceUpdatedAt: {
          type: 'string',
          format: 'date-time',
          description:
            'Момент, на который актуальны данные по версии источника',
        },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Ни основной источник, ни резервный недоступны',
  })
  @Get('currencies/:currency')
  async getCurrencyRate(@Param('currency') currency: string) {
    return await this.currencyService.getExchangeCurrencyRate(currency);
  }

  @ApiOperation({
    summary: 'Сравнение двух источников курсов к рублю',
    description:
      'Опрашивает оба источника (Exchange_API и парсер cbr.ru) и показывает по каждому доступность и дату ' +
      'актуальности данных, а также какой из них свежее. Поле moreActual равно null, если сравнить не с чем — ' +
      'например, один из источников не ответил. Только для рубля: cbr.ru публикует курсы исключительно к RUB.',
  })
  @ApiOkResponse({
    description: 'Состояние и свежесть данных по каждому источнику',
  })
  @Get('compare/rub')
  async getCompareSources() {
    return await this.rubSourceCompareService.compare();
  }

  @ApiOperation({
    summary: 'Проверка доступности источников курсов',
    description:
      'Активная проверка: обращается к обоим источникам прямо во время запроса и возвращает по каждому статус, ' +
      'задержку ответа и накопленную долю успешных проверок за время работы приложения. Счётчики живут в памяти ' +
      'процесса и обнуляются при перезапуске.',
  })
  @ApiOkResponse({ description: 'Статус и метрики по каждому источнику' })
  @Get('health')
  async getHealth() {
    return await this.currencyHealthService.checkHealth();
  }
}
