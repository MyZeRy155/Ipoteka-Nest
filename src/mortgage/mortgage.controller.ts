import { CalculateMortgageDto } from './dto/calculate-mortgage.dto'
import {Body, Controller, Delete, Get, Param, Post} from '@nestjs/common';
import { MortgageService } from './mortgage.service';
import { MortgageRecordResultDto } from './dto/mortgage-result.dto';

@Controller()
export class MortgageController {
    constructor(private readonly mortgageService: MortgageService) {
    }

    @Post('calculate')
        getMortgage(@Body() calculateMortgageDto: CalculateMortgageDto): Promise<MortgageRecordResultDto>
            { return this.mortgageService.calculateMortgage(calculateMortgageDto); }

    @Get('calculations')
        async getAllCalcRecords(): Promise<MortgageRecordResultDto[]>
            { return this.mortgageService.getAllCalcRecords(); }


    @Get('calculations/:id')
        async getOneCalcRecord(@Param('id') id: string): Promise<MortgageRecordResultDto>
            { return this.mortgageService.getOneCalcRecord(id); }

    @Delete('calculations/:id')
        async deleteOneCalcRecord(@Param('id') id: string): Promise<MortgageRecordResultDto>
            { return this.mortgageService.deleteOneCalcRecord(id); }

}
