# HU-01 — Repo with NestJS in Clean Architecture and base frontend

**Owner:** Luis · **Epic:** E0 — Infrastructure and architecture · **Priority:** Alta
**Source:** `docs/Comercial360_Historias_y_Reparto_v2.pdf`

> As a team, we want a repo with NestJS in Clean Architecture and the base frontend, so we can work in parallel.

## Acceptance criteria

| Criterion | Status |
|---|---|
| `domain/` `application/` `infrastructure/` `presentation/` folders per module | ✅ Done |
| Persistence with TypeORM over PostgreSQL, migrations, no `synchronize` | ✅ Done |
| `.env.example` | ✅ Done |
| README explaining how to run the project | ✅ Done |

## What was implemented

### 1. Folder structure and dependency rule

Every business module lives under `src/modules/<module>/` with 4 layers, dependencies always pointing inward:

```
src/
  shared/              # config and cross-cutting utilities
  modules/
    <module>/
      domain/          # entities, value objects, repository interfaces (abstract classes), domain errors
      application/     # use cases, input/output DTOs
      infrastructure/  # TypeORM entities, mappers, repository implementations, migrations
      presentation/    # controllers, request/response DTOs, Swagger decorators
      <module>.module.ts  # binds each abstract class to its implementation (DI)
```

`domain` imports nothing external (not even NestJS or TypeORM); `application` only imports `domain`; `infrastructure` and `presentation` depend on the inner layers, never the other way around.

### 2. `zones` as the reference module

`src/modules/zones/` is a working vertical slice demonstrating the pattern the rest of the team replicates for their own modules:

- **Domain** — `Zone` entity, `ZoneRepository` abstract class (the port), `ZoneNameAlreadyExistsError`.
- **Application** — `CreateZoneUseCase` (enforces unique names), `ListZonesUseCase`.
- **Infrastructure** — `ZoneOrmEntity` (TypeORM entity mapped to table `zones`), `ZoneMapper` (domain ↔ ORM), `TypeOrmZoneRepository` (implements `ZoneRepository`), and the first migration (`1792430815281-CreateZonesTable.ts`).
- **Presentation** — `ZonesController` (`GET /zones`, `POST /zones`), `CreateZoneDto` / `ZoneResponseDto` with Swagger annotations.
- **Wiring** — `zones.module.ts` binds the abstract `ZoneRepository` to `TypeOrmZoneRepository` via DI and is imported into `AppModule`.

### 3. TypeORM: runtime connection + CLI migrations

Two separate TypeORM configurations, by design:

- **Runtime** (`src/app.module.ts`): `TypeOrmModule.forRootAsync(...)` reads connection settings from `ConfigService`, `type: 'postgres'`, `autoLoadEntities: true`, **`synchronize: false`**.
- **CLI** (`src/shared/config/data-source.ts`): a standalone `DataSource` for the TypeORM CLI, since migration commands run outside Nest's DI/`ConfigModule`. It globs entities and migrations from `src/modules/**/infrastructure/`.

npm scripts wrap the CLI through `tsx` (so migrations can be authored in TypeScript without a separate compile step) and Node's native `--env-file=.env`:

```json
"typeorm": "node --env-file=.env --import tsx node_modules/typeorm/cli.js -d src/shared/config/data-source.ts",
"migration:generate": "npm run typeorm -- migration:generate",
"migration:run": "npm run typeorm -- migration:run",
"migration:revert": "npm run typeorm -- migration:revert"
```

### 4. Config and database driver

- `@nestjs/config` + `src/shared/config/configuration.ts` centralize `PORT`, `POSTGRES_*`, and `JWT_*` from environment variables.
- The Postgres driver (`pg`) replaced an earlier, mistaken `mysql2` dependency — the spec requires PostgreSQL on Amazon RDS.

### 5. `.env.example` and `README.md`

- `.env.example` documents the required variables (`POSTGRES_*`, `PORT`, `CONTAINER_NAME`, `JWT_*`).
- `README.md` was rewritten (replacing the default `nest new` boilerplate) with project-specific setup, Docker usage, migration commands, the architecture layout, and a script reference table.

## Verified in this environment

- `npm run build` — clean.
- `npm run lint` — clean (`oxlint --type-aware`).
- `npm run test` — unit tests pass.
- `npm run typeorm -- --help` — the `tsx` + `--env-file` CLI setup loads correctly.

## Not yet verified

No Docker daemon was reachable in the sandbox this was built in, so the following still need to run against a live Postgres before HU-01 is considered fully closed:

- `npm run migration:run` — applying `CreateZonesTable` to a real database.
- `npm run test:e2e` — it now boots the real `TypeOrmModule` (previously it didn't need a database at all).

## Explicitly out of scope

These belong to other stories and were **not** implemented as part of HU-01:

- Global `ValidationPipe`, exception filter, shared pagination DTO — **HU-04** (Luis, Media priority).
- `ActivityLogService` / `FileStorageService` abstract classes — introduced when **HU-15** (Yesid) and **HU-29** (Carlos) need them.
- `class-validator` decorators on `zones`' DTOs — deferred for the same reason as the `ValidationPipe` above.

## Known pre-existing issue

A duplicate `src/zones/{domain,application,infrastructure,presentation}` folder tree (wrong location, outside `src/modules/`) existed briefly during setup and has since been removed. The only structure now is the correctly-placed `src/modules/zones/`.
