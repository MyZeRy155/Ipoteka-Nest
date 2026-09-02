import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrencyService } from './currency.service';
import { CurrencyHealthService } from './currency-health.service';
import { RubSourceCompareService } from './rub-source-compare.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('currency')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CurrencyController {
  constructor(
    private readonly currencyService: CurrencyService,
    private readonly currencyHealthService: CurrencyHealthService,
    private readonly rubSourceCompareService: RubSourceCompareService,
  ) {}

  @Get('currencies/:currency')
  async getCurrencyRate(@Param('currency') currency: string) {
    return await this.currencyService.getExchangeCurrencyRate(currency);
  }

  @Get('compare/rub')
  async getCompareSources() {
    return await this.rubSourceCompareService.compare();
  }

  @Get('health')
  async getHealth() {
    return await this.currencyHealthService.checkHealth();
  }
}
