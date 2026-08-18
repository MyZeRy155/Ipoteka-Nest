import { Test, TestingModule } from '@nestjs/testing';
import { MortgageService } from './mortgage.service';

describe('MortgageService', () => {
  let service: MortgageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MortgageService],
    }).compile();

    service = module.get<MortgageService>(MortgageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
