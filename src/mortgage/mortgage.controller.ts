import { CalculateMortgageDto } from './dto/calculate-mortgage.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MortgageService } from './mortgage.service';
import MortgageRecordResultDto from './dto/mortgage-result.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetCalculationsQueryDto } from './dto/get-calculations-query.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Токен отсутствует или недействителен',
})
@ApiTags('mortgage')
export class MortgageController {
  constructor(private readonly mortgageService: MortgageService) {}

  @ApiOperation({
    summary: 'Рассчитать параметры ипотеки и сохранить результат',
    description:
      'Считает аннуитетный платёж, общую сумму выплат и переплату, после чего сохраняет расчёт за текущим ' +
      'пользователем. При нулевой ставке сумма просто делится на срок. Владелец берётся из токена, поэтому ' +
      'записать расчёт на чужое имя нельзя.',
  })
  @ApiCreatedResponse({
    type: MortgageRecordResultDto,
    description:
      'Результат расчёта вместе с идентификатором сохранённой записи',
  })
  @Post('calculate')
  getMortgage(
    @Body() calculateMortgageDto: CalculateMortgageDto,
    @Request() req,
  ): Promise<MortgageRecordResultDto> {
    return this.mortgageService.calculateMortgage(
      calculateMortgageDto,
      req.user.sub,
    );
  }

  @ApiOperation({
    summary: 'Список сохранённых расчётов',
    description:
      'Постраничный список с фильтром по диапазону процентной ставки. Обычный пользователь видит только свои ' +
      'расчёты, роль admin — расчёты всех пользователей.',
  })
  @ApiOkResponse({ type: [MortgageRecordResultDto] })
  @Get('calculations')
  async getAllCalcRecords(
    @Query() query: GetCalculationsQueryDto,
    @Request() req,
  ): Promise<MortgageRecordResultDto[]> {
    return this.mortgageService.getAllCalcRecords(query, {
      role: req.user.role,
      sub: req.user.sub,
    });
  }

  @ApiParam({
    name: 'id',
    description: 'Идентификатор записи расчёта в базе данных',
    example: 1,
  })
  @ApiOperation({
    summary: 'Получить один расчёт по идентификатору',
    description:
      'Чужой расчёт получить нельзя: обычному пользователю он отдаётся как 404, а не 403 — так по ответу ' +
      'нельзя определить, существует ли запись с таким идентификатором вообще. Роль admin видит любые записи.',
  })
  @ApiOkResponse({ type: MortgageRecordResultDto })
  @ApiNotFoundResponse({
    description: 'Расчёт не найден или принадлежит другому пользователю',
  })
  @Get('calculations/:id')
  async getOneCalcRecord(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<MortgageRecordResultDto> {
    return this.mortgageService.getOneCalcRecord(id, {
      role: req.user.role,
      sub: req.user.sub,
    });
  }

  @ApiParam({
    name: 'id',
    description: 'Идентификатор записи расчёта в базе данных',
    example: 1,
  })
  @ApiOperation({
    summary: 'Удалить расчёт по идентификатору',
    description:
      'Удалить можно только собственный расчёт; для чужого вернётся 404 по той же причине, что и при чтении. ' +
      'Роль admin может удалить любой расчёт.',
  })
  @ApiOkResponse({ description: 'Расчёт удалён' })
  @ApiNotFoundResponse({
    description: 'Расчёт не найден или принадлежит другому пользователю',
  })
  @Delete('calculations/:id')
  async deleteOneCalcRecord(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    return this.mortgageService.deleteOneCalcRecord(id, {
      sub: req.user.sub,
      role: req.user.role,
    });
  }
}
