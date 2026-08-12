import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MortgageModule } from './mortgage/mortgage.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MortgageModule, ConfigModule.forRoot({isGlobal: true})],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
