import { UsersService } from './users.service';
import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Post,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { toUserResponse } from './dto/user.mapper';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { Role } from './entities/role.enum';
import { Roles } from './roles-decorator';
import { RolesGuard } from './roles.guard';
import { UserResponseDto } from './dto/user-response.dto';
import { StepUpGuard } from '../whitelist/step-up.guard';

@ApiTags('users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Токен отсутствует или недействителен',
})
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @ApiOperation({
    summary: 'Собственный профиль',
    description:
      'Данные пользователя, которому принадлежит токен. Доступно любой роли; чужой профиль получить нельзя — ' +
      'идентификатор берётся из токена, а не из параметров запроса.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @Get('me')
  async getUserById(@Request() req) {
    const id = req.user.sub;
    return toUserResponse(await this.userService.getById(id));
  }

  @ApiOperation({
    summary: 'Список всех пользователей',
    description:
      'Постраничный список. Только для роли admin: обычный пользователь видит лишь свой профиль через /users/me. ' +
      'Дополнительного подтверждения не требует — это чтение, изменений оно не вносит.',
  })
  @ApiOkResponse({
    description: 'Страница списка пользователей',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(UserResponseDto) },
        },
        total: { type: 'number', example: 137 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Требуется роль admin' })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Get()
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.userService.findAll(query);
  }

  @ApiOperation({
    summary: 'Сброс пароля пользователя администратором',
    description:
      'Выдаёт пользователю временный пароль и обнуляет его refresh-токен, завершая активные сессии. ' +
      'Действие чувствительное: если IP администратора отсутствует в белом списке, перед выполнением ' +
      'запрашивается дополнительное подтверждение (сейчас — заглушка, запрос не прерывается).',
  })
  @ApiOkResponse({ description: 'Пароль сброшен' })
  @ApiForbiddenResponse({
    description:
      'Нужна роль admin или выше, и ранг инициатора должен быть строго выше ранга цели: ' +
      'над равным по роли и над старшим действовать нельзя',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @UseGuards(RolesGuard, StepUpGuard)
  @Roles(Role.Admin)
  @Post('/:id/reset-password')
  async resetPasswordByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    await this.userService.resetPassword(id, {
      sub: req.user.sub,
      role: req.user.role,
    });
  }

  @ApiOperation({
    summary: 'Блокировка пользователя',
    description:
      'Переводит аккаунт в статус blocked и обнуляет refresh-токен: войти заново нельзя, обновить сессию тоже. ' +
      'Чувствительное действие — с недоверенного IP требует дополнительного подтверждения (сейчас заглушка).',
  })
  @ApiOkResponse({ description: 'Пользователь заблокирован' })
  @ApiForbiddenResponse({
    description:
      'Нужна роль admin или выше, и ранг инициатора должен быть строго выше ранга цели: ' +
      'над равным по роли и над старшим действовать нельзя',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @UseGuards(RolesGuard, StepUpGuard)
  @Roles(Role.Admin)
  @Post('/:id/block-user')
  async blockUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    await this.userService.blockUser(id, {
      sub: req.user.sub,
      role: req.user.role,
    });
  }

  @ApiOperation({
    summary: 'Разблокировка пользователя',
    description:
      'Возвращает аккаунту статус active. Пароль при этом не меняется, войти можно прежними учётными данными. ' +
      'Чувствительное действие — с недоверенного IP требует дополнительного подтверждения (сейчас заглушка).',
  })
  @ApiOkResponse({ description: 'Пользователь разблокирован' })
  @ApiForbiddenResponse({
    description:
      'Нужна роль admin или выше, и ранг инициатора должен быть строго выше ранга цели: ' +
      'над равным по роли и над старшим действовать нельзя',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @UseGuards(RolesGuard, StepUpGuard)
  @Roles(Role.Admin)
  @Post('/:id/unblock-user')
  async unBlockUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    await this.userService.unBlockUser(id, {
      sub: req.user.sub,
      role: req.user.role,
    });
  }
}
