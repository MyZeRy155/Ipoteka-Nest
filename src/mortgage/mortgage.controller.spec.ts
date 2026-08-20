import { Test, TestingModule } from '@nestjs/testing';
import { MortgageController } from './mortgage.controller';
import {MortgageService} from "./mortgage.service";

describe('MortgageController', () => {
  let controller: MortgageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MortgageController],
      providers: [
          {
              provide: MortgageService,
              useValue: {
                  calculateMortgage: jest.fn(),
                  getAllCalcRecords: jest.fn(),
                  getOneCalcRecord: jest.fn(),
                  deleteOneCalcRecord: jest.fn(),
              }
          }
      ]
    }).compile();

    controller = module.get<MortgageController>(MortgageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
