import { Module } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { ParseService } from '../parser/parse-currency-rate.cbrf';
import { ResilientHttpModule } from '../common/resilient-http/resilient-http.module';
import { CurrencyHealthService } from './currency-health.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        stores: [
          new KeyvRedis(
            `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
          ),
        ],
      }),
    }),
    ResilientHttpModule,
  ],
  providers: [CurrencyService, ParseService, CurrencyHealthService],
  controllers: [CurrencyController],
})
export class CurrencyModule {}
