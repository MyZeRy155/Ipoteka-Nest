import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {ValidationPipe} from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder().setTitle('IpotekaNest').setVersion('1.0').addServer('http://localhost:3000').build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
  app.useGlobalPipes(new ValidationPipe({transform: true, whitelist: true}))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
