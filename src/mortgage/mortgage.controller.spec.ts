import { Test, TestingModule } from '@nestjs/testing';
import { MortgageController } from './mortgage.controller';

describe('MortgageController', () => {
  let controller: MortgageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MortgageController],
    }).compile();

    controller = module.get<MortgageController>(MortgageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
