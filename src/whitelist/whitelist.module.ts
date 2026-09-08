import { Module } from '@nestjs/common';
import { WhiteListIp } from './entities/whitelist.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { WhiteListController } from './whitelist.controller';
import { WhitelistService } from './whitelist.service';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhiteListIp]),
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
    VerificationModule,
  ],
  controllers: [WhiteListController],
  providers: [WhitelistService],
  exports: [WhitelistService],
})
export class WhitelistModule {}
