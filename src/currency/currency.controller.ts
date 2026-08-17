import {Controller, Get, UseGuards,Request } from '@nestjs/common';
import {AuthGuard} from "../auth/auth.guard";

@Controller('currency')
@UseGuards(AuthGuard)
export class CurrencyController {

    @Get('currencies')
    testMethod(@Request() req) {
        return req.user
    }

}
