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
} from '@nestjs/common';
import { MortgageService } from './mortgage.service';
import MortgageRecordResultDto from './dto/mortgage-result.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetCalculationsQueryDto } from './dto/get-calculations-query.dto';

@Controller()
@ApiTags('mortgage')
export class MortgageController {
  constructor(private readonly mortgageService: MortgageService) {}

  @ApiOperation({
    summary: 'Рассчитать параметры ипотеки и сохранить результат',
  })
  @Post('calculate')
  getMortgage(
    @Body() calculateMortgageDto: CalculateMortgageDto,
  ): Promise<MortgageRecordResultDto> {
    return this.mortgageService.calculateMortgage(calculateMortgageDto);
  }

  @ApiOperation({ summary: 'Получить список всех сохранённых расчётов' })
  @Get('calculations')
  async getAllCalcRecords(
    @Query() query: GetCalculationsQueryDto,
  ): Promise<MortgageRecordResultDto[]> {
    return this.mortgageService.getAllCalcRecords(query);
  }

  @ApiParam({
    name: 'id',
    description: "Идентификатор записи расчёта в базе данных'",
  })
  @ApiOperation({ summary: 'Получить один расчёт по идентификатору' })
  @Get('calculations/:id')
  async getOneCalcRecord(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MortgageRecordResultDto> {
    return this.mortgageService.getOneCalcRecord(id);
  }

  @ApiParam({
    name: 'id',
    description: "Идентификатор записи расчёта в базе данных'",
  })
  @ApiOperation({ summary: 'Удалить расчёт по идентификатору' })
  @Delete('calculations/:id')
  async deleteOneCalcRecord(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.mortgageService.deleteOneCalcRecord(id);
  }
}
