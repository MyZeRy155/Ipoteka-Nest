import { Module } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { HttpModule } from '@nestjs/axios'
import {CacheModule} from "@nestjs/cache-manager";
import {ConfigService} from "@nestjs/config";
import KeyvRedis from "@keyv/redis";

@Module({
  imports: [
      HttpModule.register({timeout: 8000}),
      CacheModule.registerAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          stores: [new KeyvRedis(`redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`)]
        })
      })
  ],
  providers: [CurrencyService],
  controllers: [CurrencyController]
})
export class CurrencyModule {}
