# Seed data

There is no standalone user seed. Users are created by the **demo seed** (`npm run seed:demo`, source in `src/seeds/demo.seed.ts`), together with the rest of the demo data.

## Users created by the demo seed

| Role | Email |
|---|---|
| `ADMIN` | `admin@demo.comercial360.co` |
| `DIRECTOR_REGIONAL` (Barranquilla Norte) | `director@demo.comercial360.co` |
| `ASESOR` | `laura.martinez@demo.comercial360.co` |
| `ASESOR` | `andres.pacheco@demo.comercial360.co` |
| `ASESOR` | `camila.herrera@demo.comercial360.co` |

- **Password:** every demo user uses the value of `DEMO_PASSWORD` in `.env` (at least 8 characters). If it is not set, the seed stops without creating anything. No password is stored in the repository.
- **Other data:** the same run also creates 20 clients (with contacts and portfolios), 4 routes with their visits, completed visits, quotes, an order and follow-ups. Users can't be seeded on their own.
- **Idempotent:** if the demo admin already exists, running the seed again does nothing.
- **Requirement:** the migrations must be applied first (`npm run migration:run`).

## How to run it

```bash
# .env
DEMO_PASSWORD=<at least 8 characters>

npm run migration:run
npm run seed:demo
```

`seed:demo` builds the app and runs `dist/seeds/demo.seed.js`. The demo data itself (clients, advisors, routes, products) is in `src/seeds/demo-data.ts`.

## Catalogs

On startup the application only seeds the catalogs (zones, client types, potentials, client statuses, portfolios and visit results), not users. See `docs/HU-14.md`.

## First admin without the demo seed

1. Register through `POST /auth/register` (new users get the `ASESOR` role).
2. Promote the account by hand in SQL:

   ```sql
   UPDATE "user" SET "role" = 'ADMIN' WHERE "email" = '<your email>';
   ```

From then on, that admin can create advisors with `POST /advisors` and change roles with `PATCH /auth/users/:userId/role`.

See also `docs/HU-42.md`.
