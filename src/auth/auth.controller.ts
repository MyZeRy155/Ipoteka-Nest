import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Throttle } from '@nestjs/throttler';
import { SkipWhiteList } from '../whitelist/skip-whitelist.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenGuard } from './refresh-token.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiCreatedResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

const tokenPairSchema = {
  type: 'object',
  properties: {
    access_token: {
      type: 'string',
      description: 'Короткоживущий токен доступа, передаётся в Authorization',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    refresh_token: {
      type: 'string',
      description:
        'Токен обновления. Его хеш хранится у пользователя, поэтому активна всегда только последняя выданная пара',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  },
} as const;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Вход по логину и паролю',
    description:
      'Проверяет пароль и статус аккаунта, после чего сверяет город входа со списком доверенных локаций пользователя. ' +
      'Вход из незнакомого города — повод для дополнительного подтверждения; сейчас эта проверка реализована заглушкой ' +
      'и вход не прерывает, город просто добавляется в список доверенных. Заблокированный аккаунт получает 401.',
  })
  @ApiOkResponse({
    description: 'Пара токенов',
    schema: tokenPairSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Неверный логин или пароль, либо аккаунт заблокирован',
  })
  @ApiTooManyRequestsResponse({
    description: 'Превышен лимит попыток входа',
  })
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: {} })
  @Post('login')
  signIn(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.signIn(dto.username, dto.password, req);
  }

  @ApiOperation({
    summary: 'Регистрация нового пользователя',
    description:
      'Создаёт пользователя с ролью user и сразу выдаёт пару токенов. Город регистрации записывается как первая ' +
      'доверенная локация — от неё дальше отсчитываются подозрительные входы. Роль admin через API не выдаётся.',
  })
  @ApiCreatedResponse({
    description: 'Пользователь создан, выдана пара токенов',
    schema: tokenPairSchema,
  })
  @ApiConflictResponse({ description: 'Имя пользователя уже занято' })
  @ApiTooManyRequestsResponse({ description: 'Превышен лимит запросов' })
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ auth: {} })
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  @ApiOperation({
    summary: 'Содержимое текущего access-токена',
    description:
      'Возвращает полезную нагрузку токена: идентификатор пользователя, имя и роль. Обращения к базе не делает.',
  })
  @ApiOkResponse({
    description: 'Полезная нагрузка access-токена',
    schema: {
      type: 'object',
      properties: {
        sub: { type: 'number', example: 42 },
        username: { type: 'string', example: 'Alexandr' },
        role: {
          type: 'string',
          enum: ['user', 'admin', 'superAdmin'],
          example: 'user',
        },
        iat: { type: 'number', example: 1788868198 },
        exp: { type: 'number', example: 1788871798 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Токен отсутствует или недействителен',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @ApiOperation({
    summary: 'Обновление пары токенов',
    description:
      'Принимает refresh-токен в заголовке Authorization и выдаёт новую пару. Старый refresh-токен после этого ' +
      'недействителен: у пользователя хранится хеш только последнего выданного.',
  })
  @ApiOkResponse({ description: 'Новая пара токенов', schema: tokenPairSchema })
  @ApiUnauthorizedResponse({
    description:
      'Refresh-токен недействителен, не совпадает с сохранённым или сессия завершена',
  })
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: {} })
  @Post('refresh')
  refresh(@Req() req) {
    return this.authService.refreshTokens(req.user.sub, req.refreshToken);
  }

  @ApiOperation({
    summary: 'Выход из аккаунта',
    description:
      'Стирает сохранённый хеш refresh-токена, после чего обновить сессию нельзя. Уже выданный access-токен ' +
      'продолжает действовать до истечения своего срока — отзыва access-токенов в системе нет.',
  })
  @ApiOkResponse({ description: 'Сессия завершена' })
  @ApiUnauthorizedResponse({
    description: 'Токен отсутствует или недействителен',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Req() req) {
    return this.authService.logout(req.user.sub);
  }

  @ApiOperation({
    summary: 'Смена собственного пароля',
    description:
      'Требует текущий пароль независимо от того, откуда пришёл запрос. После смены выдаётся новая пара токенов, ' +
      'а прежний refresh-токен перестаёт действовать.',
  })
  @ApiOkResponse({
    description: 'Пароль изменён, выдана новая пара токенов',
    schema: tokenPairSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Текущий пароль указан неверно либо токен недействителен',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch('/users/me/password')
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    const id = req.user.sub;
    return await this.authService.changePassword(id, dto);
  }
}
