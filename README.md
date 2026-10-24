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

2. Install dependencies (for running the backend outside Docker):

   ```bash
   npm install
   ```

3. Start the application stack with Docker:

   ```bash
   docker compose up --build
   ```

   Compose starts the API, PostgreSQL, Redis, and Mailpit. The API container
   runs pending migrations before starting. Password-reset messages are
   available at `http://localhost:8025`.

   To run the app outside Docker, set `POSTGRES_HOST=localhost`,
   `REDIS_URL=redis://localhost:6379`, `SMTP_HOST=localhost`, and strong
   `JWT_SECRET` and `BETTER_AUTH_SECRET` values in `.env`, then start with:

   ```bash
   npm run start:dev
   ```

4. When running outside Docker, run migrations separately (the app starts with `synchronize: false`):

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
for login, refresh, and all protected endpoints. Better Auth also provides
cookie sessions for Microsoft OAuth and manages password-reset tokens in
PostgreSQL. Set `JWT_SECRET` and `BETTER_AUTH_SECRET` to cryptographically
random values of at least 32 characters (for example, `openssl rand -base64 48`).

- `POST /auth/register` and `POST /auth/login` return `accessToken`,
  `refreshToken`, `tokenType`, `expiresIn`, and the user.
- Send the access token as `Authorization: Bearer <accessToken>` to protected
  endpoints.
- `POST /auth/refresh` accepts `{ "refreshToken": "..." }` and returns a new
  token pair. Each refresh token is single-use.
- `POST /auth/logout` requires a valid bearer access token and revokes its
  Redis session.
- `POST /auth/forgot-password` accepts `{ "email": "user@example.com" }` and
  always returns a generic response. Configure `SMTP_HOST`, `SMTP_PORT`,
  `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` to deliver
  recovery email. The reset token expires after 30 minutes by default; change
  this with `PASSWORD_RESET_TOKEN_TTL_SECONDS`. Tokens are single-use.
- `POST /auth/reset-password` accepts `{ "token": "...", "newPassword": "..." }`.
  A successful reset revokes JWT sessions and Better Auth sessions.
- Better Auth endpoints are mounted at `/api/auth/*`; use Better Auth's client
  for Microsoft OAuth and its native session flow. `BETTER_AUTH_URL` must be the
  externally reachable backend URL, and `FRONTEND_URL` must be the frontend
  origin.

Set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, and
`MICROSOFT_TENANT_ID` together to enable Microsoft sign-in. Register a Microsoft
Entra ID application:

1. In **Microsoft Entra admin center → App registrations**, create an app and
   select **Accounts in this organizational directory only**.
2. Under **Authentication**, add a **Web** platform and register
   `http://localhost:3015/api/auth/callback/microsoft` for local development,
   or `${BETTER_AUTH_URL}/api/auth/callback/microsoft` in deployment.
3. Under **Token configuration**, add the `email` optional claim to the ID
   token so Better Auth can verify the user's tenant email claim.
4. Under **Certificates & secrets**, create a client secret and copy its value
   immediately.
5. From the app's **Overview**, copy the Application (client) ID and Directory
   (tenant) ID into `MICROSOFT_CLIENT_ID` and `MICROSOFT_TENANT_ID`. Set the
   copied secret value as `MICROSOFT_CLIENT_SECRET`, then restart the backend.

The configured tenant ID binds Microsoft sign-in to that organizational tenant.
Only Microsoft profiles with a verified email claim are accepted. This allows
linking an existing local account by its verified Microsoft email while
avoiding linking based only on an unverified email string. The existing user's
role is retained.

This repository contains the backend only, so it has no login page to update.
The frontend should add the forgot-password link and form using
`POST /auth/forgot-password`, and submit the token from the reset redirect to
`POST /auth/reset-password`. For Microsoft sign-in, initialize Better Auth's
client with the backend URL and call
`signIn.social({ provider: "microsoft", callbackURL: "<frontend-url>" })`;
send requests with credentials enabled so the Better Auth cookie session is
available to protected backend endpoints.

## Roles

New users are assigned the `ASESOR` role by default. Available roles are `ADMIN`,
`DIRECTOR_REGIONAL`, and `ASESOR`; a regional director must be assigned to a zone.
Only an Admin can change a user's role through `PATCH /auth/users/:userId/role`:

```json
{ "role": "DIRECTOR_REGIONAL", "zoneId": 1 }
```

Omit `zoneId` for `ADMIN` and `ASESOR`. After running the migrations and
registering the first administrator account, promote it once directly in PostgreSQL:

```sql
UPDATE "user" SET "role" = 'ADMIN' WHERE "email" = 'admin@example.com';
```

The `@Roles(...)` decorator and `RolesGuard` protect endpoints that declare them.
JWT sessions are validated through Redis, and roles are read from PostgreSQL
to avoid trusting stale token data. Filtering routes, visits, and quotes by
advisor/zone and role-based frontend menus remain out of scope because those
modules and the frontend are not in this repository.

## Advisors

Advisor management is restricted to Admin users and uses the `asesor` table
(`id_asesor`, `nombre`, `correo`, `telefono`, `estado`, `id_usuario`). The linked
user must exist and have the `ASESOR` role. Advisor email uniqueness is
case-insensitive.

- `POST /advisors`: create an advisor with `nombre`, `correo`, `telefono`, and
  `idUsuario`.
- `GET /advisors`: list advisors, including inactive advisors by default.
  Use `?includeInactive=false` to list active advisors only.
- `GET /advisors/:id`: get an advisor.
- `PATCH /advisors/:id`: edit advisor details or change the linked user.
- `PATCH /advisors/:id/status`: set `{ "estado": true|false }`.
- `DELETE /advisors/:id`: deactivate the advisor; this never deletes the row.
- `GET /advisors/available-for-routes`: list active advisors for route assignment.

`AdvisorService.getActiveForRouteAssignment(id)` is exported for route-creation
use cases to reject inactive advisors. This repository does not yet contain a
route module, so no route-creation endpoint can call it yet. There is also no
frontend application in this repository, so advisor screens are not included.

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
