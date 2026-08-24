import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { CurrencyModule } from '../src/currency/currency.module';
import { AuthModule } from '../src/auth/auth.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { HttpExceptionFilter } from '../src/http-exception.filter';

describe('Auth + Currency (e2e)', () => {
  let app: INestApplication;
  let httpService: { get: jest.Mock };

  beforeAll(async () => {
    httpService = { get: jest.fn() };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        CurrencyModule,
      ],
    })
      .overrideProvider(HttpService)
      .useValue(httpService)
      .overrideProvider(CACHE_MANAGER)
      .useValue({ get: jest.fn(), set: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login - валидные данные возвращают access_token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'Alexandr', password: 'strongpass' })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
  });

  it('POST /auth/login — неверный пароль возвращает 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'Alexandr', password: 'wronpass' })
      .expect(401);
  });

  it('GET /currency/currencies/:currency — без токена возвращает 401', async () => {
    await request(app.getHttpServer())
      .get('/currency/currencies/USD')
      .expect(401);
  });

  it('GET /currency/currencies/:currency — с токеном возвращает данные', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'Alexandr', password: 'strongpass' });
    const token = loginResponse.body.access_token;

    (httpService.get as jest.Mock).mockReturnValue(
      of({ data: { conversion_rates: { USD: 1 } } }),
    );

    const response = await request(app.getHttpServer())
      .get('/currency/currencies/USD')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      baseCurrency: 'USD',
      rates: { USD: 1 },
      source: 'Exchange_API',
    });
  });

  it('GET /currency/currencies/:currency — при недоступности источника возвращает 503 в едином формате', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'Alexandr', password: 'strongpass' });
    const token = loginResponse.body.access_token;

    httpService.get.mockReturnValue(
      throwError(() => new Error('network error')),
    );

    const assertion = request(app.getHttpServer())
      .get('/currency/currencies/USD')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);

    const response = await assertion;
    expect(response.body).toMatchObject({
      statusCode: 503,
      path: '/currency/currencies/USD',
    });
    expect(response.body.message).toContain('источник недоступен');
  }, 20000);
});
