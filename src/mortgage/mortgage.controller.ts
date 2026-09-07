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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetCalculationsQueryDto } from './dto/get-calculations-query.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
@UseGuards(AuthGuard)
@ApiTags('mortgage')
export class MortgageController {
  constructor(private readonly mortgageService: MortgageService) {}

  @ApiOperation({
    summary: 'Рассчитать параметры ипотеки и сохранить результат',
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

  @ApiOperation({ summary: 'Получить список всех сохранённых расчётов' })
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
    description: "Идентификатор записи расчёта в базе данных'",
  })
  @ApiOperation({ summary: 'Получить один расчёт по идентификатору' })
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
    description: "Идентификатор записи расчёта в базе данных'",
  })
  @ApiOperation({ summary: 'Удалить расчёт по идентификатору' })
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
