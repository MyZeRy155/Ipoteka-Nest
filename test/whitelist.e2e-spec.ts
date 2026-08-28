import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/http-exception.filter';
import { GeoService } from '../src/geo/geo.service';
import { WhiteListIp } from '../src/whitelist/entities/whitelist.entity';

/**
 * Требует поднятые Postgres и Redis (docker compose up postgres redis).
 * CACHE_MANAGER замокан так, что get всегда промах → guard читает БД на каждый
 * запрос и отражает текущее состояние таблицы немедленно.
 * GeoService замокан, чтобы fire-and-forget аудита не ходил в сеть.
 */
describe('Whitelist (e2e)', () => {
  let app: INestApplication;
  let repo: Repository<WhiteListIp>;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue({
        get: jest.fn().mockResolvedValue(undefined),
        set: jest.fn(),
        del: jest.fn(),
      })
      .overrideProvider(GeoService)
      .useValue({
        getGeoLocation: jest.fn().mockResolvedValue({
          countryCode: 'UNKNOWN',
          city: 'Unknown',
          isFallback: true,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    repo = app.get(getRepositoryToken(WhiteListIp), { strict: false });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'Alexandr', password: 'strongpass' });
    token = res.body.access_token;
  });

  beforeEach(async () => {
    await repo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  const bearer = () => `Bearer ${token}`;

  // supertest подключается с localhost — покрываем оба варианта записи адреса
  const seedSelf = () =>
    repo.save([
      repo.create({ ipAddress: '127.0.0.1', label: null }),
      repo.create({ ipAddress: '::1', label: null }),
    ]);
  const seedForeign = () =>
    repo.save(repo.create({ ipAddress: '9.9.9.9', label: null }));

  it('пустой список = allow-all: /currency/health без токена → 401 (не 403)', async () => {
    await request(app.getHttpServer()).get('/currency/health').expect(401);
  });

  it('POST /whitelist добавляет запись', async () => {
    await request(app.getHttpServer())
      .post('/whitelist')
      .set('Authorization', bearer())
      .send({ ipAddress: '9.9.9.9', label: 'foreign' })
      .expect(201)
      .expect((r) => {
        expect(r.body).toEqual(
          expect.objectContaining({ ipAddress: '9.9.9.9', label: 'foreign' }),
        );
      });
  });

  it('в списке только чужой IP → /currency/health получает 403', async () => {
    await seedForeign();
    await request(app.getHttpServer()).get('/currency/health').expect(403);
  });

  it('GET /whitelist доступен в 403-режиме (@SkipWhiteList)', async () => {
    await seedForeign();
    await request(app.getHttpServer())
      .get('/whitelist')
      .set('Authorization', bearer())
      .expect(200);
  });

  it('POST /auth/login не блокируется whitelist', async () => {
    await seedForeign();
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'Alexandr', password: 'strongpass' })
      .expect(200);
  });

  it('невалидный IP → 400', async () => {
    await request(app.getHttpServer())
      .post('/whitelist')
      .set('Authorization', bearer())
      .send({ ipAddress: 'not-an-ip' })
      .expect(400);
  });

  it('дубликат IP → 409', async () => {
    await seedForeign();
    await request(app.getHttpServer())
      .post('/whitelist')
      .set('Authorization', bearer())
      .send({ ipAddress: '9.9.9.9' })
      .expect(409);
  });

  it('свой IP в списке → /currency/health снова 401', async () => {
    await seedSelf();
    await request(app.getHttpServer()).get('/currency/health').expect(401);
  });
});
