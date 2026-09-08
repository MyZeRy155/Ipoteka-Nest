import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const config = new DocumentBuilder()
    .setTitle('IpotekaNest')
    .setDescription(
      'Сервис расчёта ипотеки с историей расчётов, курсами валют, журналом аудита и разграничением прав.\n\n' +
        'Аутентификация — пара JWT-токенов: короткоживущий access передаётся в заголовке Authorization, ' +
        'refresh обменивается на новую пару через POST /auth/refresh. Нажмите Authorize и вставьте access-токен ' +
        'из ответа POST /auth/login.\n\n' +
        'Роли: user видит и меняет только свои данные, admin — данные всех пользователей и служебные разделы ' +
        '(список пользователей, журнал аудита, справочник доверенных IP). Через API роль admin не выдаётся: ' +
        'её проставляют в базе или сидом.\n\n' +
        'Белый список IP доступ не ограничивает — он помечает запросы как доверенные и решает, требовать ли ' +
        'дополнительное подтверждение для чувствительных админских операций. Само подтверждение сейчас ' +
        'реализовано заглушкой и запросы не прерывает.',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000')
    .addBearerAuth()
    .addTag('auth', 'Регистрация, вход, обновление токенов, смена пароля')
    .addTag('mortgage', 'Расчёт ипотеки и история расчётов')
    .addTag('currency', 'Курсы валют, сравнение источников и их доступность')
    .addTag('users', 'Профиль и администрирование учётных записей')
    .addTag('audit', 'Журнал обработанных запросов')
    .addTag('whitelist', 'Справочник доверенных IP-адресов')
    .addTag('geo', 'Определение местоположения по IP')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
