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
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/users/entities/role.enum';

/**
 * Требует поднятые Postgres и Redis (docker compose up postgres redis).
 *
 * После реворка белый список больше НЕ ограничивает доступ по IP: он хранит
 * список доверенных адресов, по которому решается, помечать ли действие как
 * доверенное (поле trusted в аудите) и запрашивать ли доп. подтверждение для
 * админских операций. Сам CRUD списка доступен только роли admin.
 *
 * CACHE_MANAGER замокан на вечный промах, чтобы список читался из БД на каждый
 * запрос и правки отражались немедленно. GeoService замокан, чтобы аудит и
 * проверка локации входа не ходили в сеть.
 */
describe('Whitelist (e2e)', () => {
  let app: INestApplication;
  let repo: Repository<WhiteListIp>;
  let userRepo: Repository<User>;
  let adminToken: string;
  let userToken: string;

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
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    repo = app.get(getRepositoryToken(WhiteListIp), { strict: false });
    userRepo = app.get(getRepositoryToken(User), { strict: false });

    adminToken = await registerAndLogin('WhitelistAdmin', Role.Admin);
    userToken = await registerAndLogin('WhitelistUser', Role.User);
  });

  beforeEach(async () => {
    await repo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Роль попадает в access-токен в момент логина, поэтому повышение до admin
   * должно произойти между регистрацией и входом: эндпоинта смены роли в API нет.
   */
  async function registerAndLogin(username: string, role: Role) {
    const password = 'strongpass';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username, password });

    if (role === Role.Admin) {
      await userRepo.update({ username }, { role: Role.Admin });
    }

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password });

    const body = res.body as { access_token: string };
    return body.access_token;
  }

  const asAdmin = () => `Bearer ${adminToken}`;
  const asUser = () => `Bearer ${userToken}`;

  const seedForeign = () =>
    repo.save(repo.create({ ipAddress: '9.9.9.9', label: 'foreign' }));

  describe('доступ к списку', () => {
    it('админ видит список', async () => {
      await request(app.getHttpServer())
        .get('/whitelist')
        .set('Authorization', asAdmin())
        .expect(200);
    });

    it('обычный пользователь получает 403', async () => {
      await request(app.getHttpServer())
        .get('/whitelist')
        .set('Authorization', asUser())
        .expect(403);
    });

    it('без токена — 401', async () => {
      await request(app.getHttpServer()).get('/whitelist').expect(401);
    });
  });

  describe('CRUD', () => {
    it('POST добавляет запись', async () => {
      await request(app.getHttpServer())
        .post('/whitelist')
        .set('Authorization', asAdmin())
        .send({ ipAddress: '9.9.9.9', label: 'foreign' })
        .expect(201)
        .expect((r) => {
          expect(r.body).toEqual(
            expect.objectContaining({ ipAddress: '9.9.9.9', label: 'foreign' }),
          );
        });
    });

    it('невалидный IP → 400', async () => {
      await request(app.getHttpServer())
        .post('/whitelist')
        .set('Authorization', asAdmin())
        .send({ ipAddress: 'not-an-ip' })
        .expect(400);
    });

    it('дубликат IP → 409', async () => {
      await seedForeign();
      await request(app.getHttpServer())
        .post('/whitelist')
        .set('Authorization', asAdmin())
        .send({ ipAddress: '9.9.9.9' })
        .expect(409);
    });

    it('DELETE несуществующей записи → 404', async () => {
      await request(app.getHttpServer())
        .delete('/whitelist/999999')
        .set('Authorization', asAdmin())
        .expect(404);
    });

    it('обычному пользователю запись создать нельзя', async () => {
      await request(app.getHttpServer())
        .post('/whitelist')
        .set('Authorization', asUser())
        .send({ ipAddress: '9.9.9.9' })
        .expect(403);
    });
  });

  describe('список больше не ограничивает доступ по IP', () => {
    it('чужой IP в списке не мешает работать с токеном', async () => {
      await seedForeign();

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', asUser())
        .expect(200);
    });

    it('чужой IP в списке не превращает 401 в 403', async () => {
      await seedForeign();

      await request(app.getHttpServer()).get('/currency/health').expect(401);
    });
  });
});
