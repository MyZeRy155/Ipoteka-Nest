import { CalculateMortgageDto } from './dto/calculate-mortgage.dto'
import { Body, Controller, Post } from '@nestjs/common';
import { MortgageService } from './mortgage.service';
import { MortgageRecordResultDto } from './dto/mortgage-result.dto';

@Controller()
export class MortgageController {
    constructor(private readonly mortgageService: MortgageService) {
    }

    @Post('calculate')
        getMortgage(@Body() calculateMortgageDto: CalculateMortgageDto): MortgageRecordResultDto
            { return this.mortgageService.calculateMortgage(calculateMortgageDto); }

}
