import { WhitelistService } from './whitelist.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateWhitelistIpDto } from './dto/create-whitelist-ip.dto';
import { WhiteListIpDto } from './dto/whitelist-ip.dto';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateWhitelistIpDto } from './dto/update-whitelist-ip.dto';
import { AuthGuard } from '../auth/auth.guard';
import { StepUpGuard } from './step-up.guard';
import { RolesGuard } from '../users/roles.guard';
import { Role } from '../users/entities/role.enum';
import { Roles } from '../users/roles-decorator';

@ApiTags('whitelist')
@Controller('whitelist')
@UseGuards(AuthGuard, RolesGuard, StepUpGuard)
@Roles(Role.Admin)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Токен отсутствует или недействителен',
})
@ApiForbiddenResponse({ description: 'Требуется роль admin' })
export class WhiteListController {
  constructor(private readonly whitelistService: WhitelistService) {}

  @ApiOperation({
    summary: 'Добавить IP в список доверенных',
    description:
      'Адрес сравнивается точно, диапазоны и маски (CIDR) не поддерживаются. Пустой список означает, что ' +
      'доверенных адресов нет вовсе — то есть все запросы считаются недоверенными, а не наоборот.',
  })
  @ApiCreatedResponse({ type: WhiteListIpDto, description: 'Запись создана' })
  @ApiConflictResponse({ description: 'Такой адрес уже есть в списке' })
  @Post()
  create(@Body() dto: CreateWhitelistIpDto): Promise<WhiteListIpDto> {
    return this.whitelistService.create(dto);
  }

  @ApiOperation({
    summary: 'Список всех доверенных IP',
    description:
      'Сортировка от новых записей к старым. Пагинации нет — это небольшой справочник.',
  })
  @ApiOkResponse({ type: [WhiteListIpDto] })
  @Get()
  findAll(): Promise<WhiteListIpDto[]> {
    return this.whitelistService.findAll();
  }

  @ApiOperation({ summary: 'Запись списка по идентификатору' })
  @ApiParam({ name: 'id', description: 'Идентификатор записи', example: 1 })
  @ApiOkResponse({ type: WhiteListIpDto })
  @ApiNotFoundResponse({ description: 'Запись не найдена' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WhiteListIpDto> {
    return this.whitelistService.findOne(id);
  }

  @ApiOperation({
    summary: 'Изменить запись списка',
    description:
      'Можно поменять адрес и пометку. Кэш списка сбрасывается только при смене самого адреса — правка пометки ' +
      'на решения о доверии не влияет.',
  })
  @ApiParam({ name: 'id', description: 'Идентификатор записи', example: 1 })
  @ApiOkResponse({ type: WhiteListIpDto })
  @ApiNotFoundResponse({ description: 'Запись не найдена' })
  @ApiConflictResponse({ description: 'Новый адрес уже есть в списке' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWhitelistIpDto,
  ): Promise<WhiteListIpDto> {
    return this.whitelistService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Удалить IP из списка',
    description:
      'После удаления запросы с этого адреса перестают считаться доверенными: их действия помечаются в аудите ' +
      'как недоверенные, а чувствительные операции начинают требовать подтверждения.',
  })
  @ApiParam({ name: 'id', description: 'Идентификатор записи', example: 1 })
  @ApiOkResponse({ description: 'Запись удалена' })
  @ApiNotFoundResponse({ description: 'Запись не найдена' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.whitelistService.remove(id);
  }
}
