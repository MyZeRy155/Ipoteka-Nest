import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyController } from './currency.controller';
import {CurrencyService} from "./currency.service";
import {AuthGuard} from "../auth/auth.guard";

describe('CurrencyController', () => {
  let controller: CurrencyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyController],
      providers: [{provide: CurrencyService, useValue: {getExchangeCurrencyRate: jest.fn() } } ]
    }).overrideGuard(AuthGuard).useValue({ canActivate: () => true}).compile();

    controller = module.get<CurrencyController>(CurrencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
