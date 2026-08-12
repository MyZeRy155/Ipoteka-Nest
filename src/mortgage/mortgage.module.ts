import { Module } from '@nestjs/common';
import { MortgageController } from './mortgage.controller';
import { MortgageService } from './mortgage.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Calculation} from "./entities/calculation";

@Module({
  imports: [TypeOrmModule.forFeature([Calculation])],
  controllers: [MortgageController],
  providers: [MortgageService]
})
export class MortgageModule {}
