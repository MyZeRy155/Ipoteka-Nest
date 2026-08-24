import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrencyService } from './currency.service';
import { CurrencyHealthService } from './currency-health.service';

@Controller('currency')
@UseGuards(AuthGuard)
export class CurrencyController {
  constructor(
    private readonly currencyService: CurrencyService,
    private readonly currencyHealthService: CurrencyHealthService,
  ) {}

  @Get('currencies/:currency')
  async getCurrencyRate(@Param('currency') currency: string) {
    return await this.currencyService.getExchangeCurrencyRate(currency);
  }
  @Get('health')
  async getHealth() {
    return await this.currencyHealthService.checkHealth();
  }
}
