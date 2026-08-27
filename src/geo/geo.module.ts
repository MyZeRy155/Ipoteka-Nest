import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { ResilientHttpModule } from '../common/resilient-http/resilient-http.module';
import { GeoService } from './geo.service';
import { GeoController } from './geo.controller';

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
  providers: [GeoService],
  controllers: [GeoController],
})
export class GeoModule {}
