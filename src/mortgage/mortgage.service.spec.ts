import { Test, TestingModule } from '@nestjs/testing';
import { MortgageService } from './mortgage.service';
import {getRepositoryToken} from "@nestjs/typeorm";
import {Calculation} from "./entities/calculation";

describe('MortgageService', () => {
  let service: MortgageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
          MortgageService,
          {
            provide: getRepositoryToken(Calculation),
            useValue: {
              save: jest.fn(),
              find: jest.fn(),
              findOneBy: jest.fn(),
              delete: jest.fn(),
            }
          }
      ],
    }).compile();

    service = module.get<MortgageService>(MortgageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
