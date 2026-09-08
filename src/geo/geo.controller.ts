import { GeoService } from './geo.service';
import { getClientIp } from '../common/get-client-ip';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('geo')
@Controller('geo')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Токен отсутствует или недействителен',
})
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @ApiOperation({
    summary: 'Определение местоположения по IP запроса',
    description:
      'IP берётся из сокета соединения, а не из заголовка X-Forwarded-For: перед приложением нет обратного ' +
      'прокси, поэтому заголовку доверять нельзя — его может подделать любой клиент. Результаты кэшируются ' +
      'в Redis на час. Для приватных адресов (localhost, внутренние сети, шлюз Docker) внешний сервис не ' +
      'опрашивается и сразу возвращается заглушка с isFallback = true — так же, как при недоступности сервиса. ' +
      'В текущей конфигурации Docker приложение видит клиента по адресу шлюза, поэтому локально этот эндпоинт ' +
      'всегда отдаёт заглушку.',
  })
  @ApiOkResponse({
    description:
      'Страна и город по IP либо заглушка, если определить не удалось',
    schema: {
      type: 'object',
      properties: {
        countryCode: { type: 'string', example: 'RU' },
        city: { type: 'string', example: 'Moscow' },
        isFallback: {
          type: 'boolean',
          example: false,
          description:
            'true означает, что местоположение определить не удалось и значения выше — заглушка',
        },
      },
    },
  })
  @Get('me')
  async getMyGeo(@Req() request: Request) {
    const ip = getClientIp(request);
    return this.geoService.getGeoLocation(ip);
  }
}
