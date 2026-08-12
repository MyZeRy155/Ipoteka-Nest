import { Module } from '@nestjs/common';
import { MortgageController } from './mortgage.controller';
import { MortgageService } from './mortgage.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {CalculationEntity} from "./entities/calculation.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CalculationEntity])],
  controllers: [MortgageController],
  providers: [MortgageService]
})
export class MortgageModule {}
