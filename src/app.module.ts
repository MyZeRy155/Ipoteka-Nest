import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MortgageModule } from './mortgage/mortgage.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calculation } from './mortgage/entities/calculation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CurrencyModule } from './currency/currency.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GeoModule } from './geo/geo.module';
import { AuditLog } from './audit/entities/audit-log.entity';
import { AuditModule } from './audit/audit.module';
import { WhiteListIp } from './whitelist/entities/whitelist.entity';
import { WhitelistModule } from './whitelist/whitelist.module';
import { User } from './users/entities/user.entity';
import { envValidationSchema } from './env-validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.getOrThrow<number>('THROTTLE_TTL'),
          limit: config.getOrThrow<number>('THROTTLE_LIMIT'),
        },
        {
          name: 'auth',
          ttl: config.getOrThrow<number>('AUTH_THROTTLE_TTL'),
          limit: config.getOrThrow<number>('AUTH_THROTTLE_LIMIT'),
        },
      ],
    }),
    MortgageModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [Calculation, AuditLog, WhiteListIp, User],
      }),
    }),
    AuthModule,
    UsersModule,
    CurrencyModule,
    GeoModule,
    AuditModule,
    WhitelistModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
