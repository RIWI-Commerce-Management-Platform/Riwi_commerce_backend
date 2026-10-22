# Comercial 360 — Backend

Comercial 360 API (clients, routes, visits, follow-ups, quotes, orders, and KPIs), built with [NestJS](https://nestjs.com) following Clean Architecture per module. Full project specification (user stories and team breakdown) in `docs/Comercial360_Historias_y_Reparto_v2.pdf`.

## Requirements

- Node.js 24+
- Docker (to run PostgreSQL and Redis locally)

## Getting started

1. Copy the environment variables and adjust them if needed:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start Postgres and the app with Docker:

   ```bash
   docker compose up
   ```

   Or, if you'd rather run the app outside Docker, set `POSTGRES_*`, `REDIS_URL`,
   and a strong `JWT_SECRET` in `.env`, then start with:

   ```bash
   npm run start:dev
   ```

4. Run the migrations (the app starts with `synchronize: false`, so the schema is managed only through migrations):

   ```bash
   npm run migration:run
   ```

The API is available at `http://localhost:${PORT}` and the Swagger docs at `http://localhost:${PORT}/docs`.

## Migrations

- Generate a migration from changes in a module's entities:

  ```bash
  npm run migration:generate -- src/modules/<module>/infrastructure/migrations/<DescriptiveName>
  ```

- Run pending migrations:

  ```bash
  npm run migration:run
  ```

- Revert the last migration:

  ```bash
  npm run migration:revert
  ```

Each module keeps its own migrations under `src/modules/<module>/infrastructure/migrations/`.

## Authentication

Authentication uses short-lived HS256 access JWTs and rotating refresh JWTs.
Redis stores active sessions and one-time refresh-token hashes; it is required
for login, refresh, and all protected endpoints. Set `JWT_SECRET` to a
cryptographically random value of at least 32 characters (for example,
`openssl rand -base64 48`).

- `POST /auth/register` and `POST /auth/login` return `accessToken`,
  `refreshToken`, `tokenType`, `expiresIn`, and the user.
- Send the access token as `Authorization: Bearer <accessToken>` to protected
  endpoints.
- `POST /auth/refresh` accepts `{ "refreshToken": "..." }` and returns a new
  token pair. Each refresh token is single-use.
- `POST /auth/logout` requires a valid bearer access token and revokes its
  Redis session.

The former Better Auth cookie and `/api/auth/*` endpoints are no longer served.
Existing account password hashes remain compatible; the legacy Better Auth
session tables may remain in PostgreSQL but are no longer used for authentication.

## Roles

New users are assigned the `ASESOR` role by default. Available roles are `ADMIN`,
`DIRECTOR_REGIONAL`, and `ASESOR`; a regional director must be assigned to a zone.
Only an Admin can change a user's role through `PATCH /auth/users/:userId/role`:

```json
{ "role": "DIRECTOR_REGIONAL", "zoneId": "<uuid-de-la-zona>" }
```

Omit `zoneId` for `ADMIN` and `ASESOR`. After running the migrations and
registering the first administrator account, promote it once directly in PostgreSQL:

```sql
UPDATE "user" SET "role" = 'ADMIN' WHERE "email" = 'admin@example.com';
```

The `@Roles(...)` decorator and `RolesGuard` protect endpoints that declare them.
JWT sessions are validated through Redis, and roles are read from PostgreSQL
to avoid trusting stale token data. Filtering routes, visits, and quotes by
advisor/zone, linking users to an `ASESOR` record, and role-based frontend menus
remain out of scope because those modules and the frontend are not in this repository.

## Architecture

Every business module lives in `src/modules/<module>/` with 4 layers (dependencies always point inward):

```
src/
  shared/              # config and cross-cutting utilities
  modules/
    <module>/
      domain/          # entities, value objects, repository interfaces (abstract classes)
      application/     # use cases, input/output DTOs
      infrastructure/  # TypeORM entities, mappers, repository implementations, migrations
      presentation/    # controllers, request/response DTOs, Swagger
      <module>.module.ts  # binds each abstract class to its implementation (DI)
```

`src/modules/zones/` is the reference module: use it as the template for new modules.

## Scripts

| Command                      | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `npm run start:dev`          | Start the app in watch mode                   |
| `npm run build`              | Compile with `nest build`                     |
| `npm run start:prod`         | Run the compiled build (`dist/main`)          |
| `npm run lint`               | `oxlint --type-aware` over `src/` and `test/` |
| `npm run format`             | Format with Prettier                          |
| `npm run test`               | Unit tests (Vitest)                           |
| `npm run test:e2e`           | End-to-end tests                              |
| `npm run test:cov`           | Unit tests with coverage                      |
| `npm run migration:generate` | Generate a migration from entity changes      |
| `npm run migration:run`      | Run pending migrations                        |
| `npm run migration:revert`   | Revert the last migration                     |
