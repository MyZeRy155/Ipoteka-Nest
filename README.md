# NodeIpoteka

Backend-сервис на NestJS для расчёта ипотечных платежей с сохранением истории расчётов в PostgreSQL.

## Стек

- NestJS + TypeScript
- TypeORM + PostgreSQL
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

- `postgres` поднимается и проходит `healthcheck` (`pg_isready`) — `app` дожидается его готовности через `depends_on: condition: service_healthy`.
- Контейнер `app` при старте (`entrypoint.sh`) последовательно выполняет:
  1. `npm run db:migrate` — накатывает миграцию.
  2. `npm run db:seed` — наполняет базу стартовыми данными.
  3. `npm run start:prod` — запускает собранное приложение.

## Эндпоинты

| Метод    | Путь                  | Описание                                  |
|----------|-----------------------|--------------------------------------------|
| `POST`   | `/calculate`          | Рассчитать ипотеку и сохранить результат   |
| `GET`    | `/calculations`       | Список всех расчётов                       |
| `GET`    | `/calculations/:id`   | Получить расчёт по id                      |
| `DELETE` | `/calculations/:id`   | Удалить расчёт по id                       |

### Пример запроса

```bash
curl -i -X POST http://localhost:3000/calculate \
  -H "Content-Type: application/json" \
  -d '{"mortgageAmount": 100000, "interestRate": 15, "mortgageTermMonths": 24}'
```

## Локальный запуск без Docker (для разработки)

1. `npm install`
2. Поднять только базу:

   ```bash
   docker compose up -d postgres
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
