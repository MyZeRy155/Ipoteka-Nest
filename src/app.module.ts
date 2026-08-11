import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MortgageModule } from './mortgage/mortgage.module';

@Module({
  imports: [MortgageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
