# NodeIpoteka

Backend-сервис на NestJS для расчёта ипотечных платежей с сохранением истории расчётов в PostgreSQL. Также включает модуль курсов валют с JWT-авторизацией и отказоустойчивой интеграцией с внешним API.

## Стек

- NestJS + TypeScript
- TypeORM + PostgreSQL
- Redis (кэш курсов валют)
- JWT (`@nestjs/jwt`) + guards
- Axios (`@nestjs/axios`) для интеграции с внешним API
- Docker / Docker Compose

## Запуск через Docker (рекомендуемый способ)

1. Склонировать репозиторий.
2. Убедиться, что в корне есть файл `.env`.
3. Поднять стек с чистой базой:

   ```bash
   docker compose down -v
   docker compose up
   ```

   Флаг `-v` обязателен — без него Postgres может переиспользовать данные от предыдущего запуска.

4. Приложение доступно на `http://localhost:3000`.

### Что происходит автоматически при старте

- `postgres` и `redis` поднимаются и проходят `healthcheck` (`pg_isready` / `redis-cli ping`) — `app` дожидается их готовности через `depends_on: condition: service_healthy`.
- Контейнер `app` при старте (`entrypoint.sh`) последовательно выполняет:
  1. `npm run db:migrate` — накатывает миграцию.
  2. `npm run db:seed` — наполняет базу стартовыми данными.
  3. `npm run start:prod` — запускает собранное приложение.

### Переменные окружения (`.env`)

| Переменная                   | Назначение                                              |
|-------------------------------|----------------------------------------------------------|
| `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` | Подключение к PostgreSQL                  |
| `PORT`                        | Порт, на котором слушает приложение                       |
| `REDIS_HOST`/`REDIS_PORT`      | Подключение к Redis (кэш курсов валют)                    |
| `REDIS_CACHE_TTL`              | Время жизни записи в кэше, **в миллисекундах**            |
| `JWT_SECRET`                   | Секрет для подписи JWT-токенов                            |
| `EXCHANGERATE_API_KEY`         | Ключ API курсов валют (exchangerate-api.com)               |
| `EXCHANGERATE_API_BASE_URL`    | Базовый URL API курсов валют                              |

См. `.env.example` за актуальным списком ключей.

## Эндпоинты

### Ипотечный калькулятор

| Метод    | Путь                  | Описание                                  |
|----------|-----------------------|--------------------------------------------|
| `POST`   | `/calculate`          | Рассчитать ипотеку и сохранить результат   |
| `GET`    | `/calculations`       | Список всех расчётов                       |
| `GET`    | `/calculations/:id`   | Получить расчёт по id                      |
| `DELETE` | `/calculations/:id`   | Удалить расчёт по id                       |

### Авторизация

| Метод  | Путь            | Описание                                          |
|--------|-----------------|-----------------------------------------------------|
| `POST` | `/auth/login`   | Логин по `username`/`password`, возвращает JWT-токен |
| `GET`  | `/auth/profile` | Данные текущего пользователя (требует `Bearer`-токен) |

### Курсы валют

| Метод | Путь                              | Описание                                                        |
|-------|-----------------------------------|--------------------------------------------------------------------|
| `GET` | `/currency/currencies/:currency`  | Курсы валют относительно `:currency` (требует `Bearer`-токен). Данные кэшируются в Redis, при недоступности внешнего источника — таймаут + ретраи с backoff, при полном отказе — `503` вместо `500`. |

### Пример запроса — калькулятор

```bash
curl -i -X POST http://localhost:3000/calculate \
  -H "Content-Type: application/json" \
  -d '{"mortgageAmount": 100000, "interestRate": 15, "mortgageTermMonths": 24}'
```

### Пример запроса — курсы валют (с авторизацией)

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "Alexandr", "password": "strongpass"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -i http://localhost:3000/currency/currencies/USD \
  -H "Authorization: Bearer $TOKEN"
```

## Локальный запуск без Docker (для разработки)

1. `npm install`
2. Поднять базу и Redis:

   ```bash
   docker compose up -d postgres redis
   ```

3. Накатить миграцию:

   ```bash
   npm run db:migrate
   ```

4. Заполнить сидом:

   ```bash
   npm run db:seed
   ```

5. Запустить в режиме разработки:

   ```bash
   npm run start:dev
   ```

## Тесты

### Unit (Jest)

```bash
npm run test
```

Покрыты: `AuthGuard` (валидный/невалидный токен, отсутствие заголовка, неверная схема авторизации), `CurrencyService` (кэш-хит, happy path с кэшированием, retry с backoff, исчерпание попыток → `503`, невалидный ответ источника → `503` без засорения кэша), плюс DI-сборка остальных модулей. Внешние зависимости (`HttpService`, `ConfigService`, `CACHE_MANAGER`, `JwtService`, TypeORM-репозиторий) замоканы — реальные Postgres/Redis/внешний API не требуются.

### e2e (Supertest)

```bash
npm run test:e2e
```

- `test/auth-currency.e2e-spec.ts` — логин (успех/неверный пароль), доступ к `/currency/currencies/:currency` без токена (`401`) и с токеном (`200`), поведение при недоступности внешнего источника (`503` в едином формате `HttpExceptionFilter`). Модуль собирается без `TypeOrmModule`/`MortgageModule` — Postgres не требуется, `HttpService`/`CACHE_MANAGER` замоканы.
- `test/app.e2e-spec.ts` — проверка корневого `GET /`, тянет весь `AppModule` целиком, поэтому требует поднятой БД:
  ```bash
  docker compose up -d postgres redis
  ```
