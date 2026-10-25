# HU-37 — Route and visit tracking table (backend)

**Owner:** Valery · **Epic:** E6 — Dashboard and Visit Map · **Priority:** High
**Source:** `docs/Comercial360_Historias_y_Reparto_v2.pdf`
**Branch:** `feat/HU-37-commercial-tracking` (from `develop`)

> **User story:** As a director, I want the "Seguimiento de rutas y visitas" table.
>
> **Acceptance criteria (source):** "Columnas del diseño; filtros y paginación en el backend."

## 1. Scope and decisions

| Criterion | Status |
|---|---|
| Filters in the backend | Done and verified |
| Pagination in the backend | Done and verified |
| Columns of the design | **Provisional**: the design is not in the repository. The columns are the real VISIT / ROUTE / CLIENT / ADVISOR / ZONE fields of the project's ER model, pending confirmation against the design |
| Table screen | Out of scope here (frontend) |

- **One row per visit** scheduled in the selected week. Only existing columns are returned; nothing is computed or invented.
- **States** are the visit module's `VisitStatus` values: `PENDING`, `IN_PROGRESS`, `VISITED`, `RESCHEDULE`, `NOT_VISITED`. The HU-36 design legend (Visitado, Pendiente, Sin visitar, Pedido cerrado, Reprogramado) maps to them in the UI; "Pedido cerrado" corresponds to `orderGenerated = true` (HU-27).
- **Filters:** week and territory (the layout's global filters), plus advisor, route and status.
- **Reused:** `PaginationQueryDto` and `PaginationMetaDto` (shared pagination), `RolesGuard` + `@Roles`, `CurrentActorProvider` + `scopeForActor` (HU-06), the read-only DAO pattern of `indicators`.
- **Not duplicated:** `GET /visits/agenda` is the authenticated advisor's own agenda and `GET /reports/visits.csv` is an unpaginated CSV export; neither serves a paginated director table.

## 2. Architecture

```text
src/modules/tracking/
├── domain/
│   ├── dao/tracking.dao.ts              # contract: findVisits(filters)
│   └── tracking-visit.ts                # filters, row and page types, BUSINESS_TIMEZONE
├── application/use-cases/
│   └── list-tracking-visits.use-case.ts # forces the director's zone
├── infrastructure/dao/
│   └── typeorm-tracking.dao.ts          # parameterized SQL (count + page)
├── presentation/
│   ├── dto/tracking-visits-query.dto.ts
│   ├── dto/tracking-visits-response.dto.ts
│   └── tracking.controller.ts           # GET /tracking/visits
└── tracking.module.ts                   # registered in AppModule
```

No tables or migrations were added. It reads `visits`, `clients`, `zones`, `routes` and `"user"`.

## 3. Endpoint contract

```http
GET /tracking/visits?weekStart=2026-10-19&territoryId=1&page=1&limit=10&order=asc
Cookie: better-auth.session_token=...
```

**Roles:** `ADMIN`, `DIRECTOR_REGIONAL`. A regional director always gets their own zone, whatever `territoryId` says.

| Query parameter | Type | Rules |
|---|---|---|
| `weekStart` | `YYYY-MM-DD` | Optional. Any day of the week; the week runs Monday 00:00 – Sunday 23:59 in America/Bogota. Default: current week |
| `territoryId` | integer > 0 | Optional. The client's zone |
| `advisorId` | integer > 0 | Optional. Visit advisor (user id) |
| `routeId` | integer > 0 | Optional |
| `status` | `PENDING` \| `IN_PROGRESS` \| `VISITED` \| `RESCHEDULE` \| `NOT_VISITED` | Optional |
| `order` | `asc` \| `desc` | Optional, default `asc`. By scheduled date (ties by visit id) |
| `page` | integer ≥ 1 | Optional, default 1 (team convention: invalid values fall back to the default) |
| `limit` | integer 1–100 | Optional, default 10, capped at 100 |

**Response 200**

| Field | Type | Meaning |
|---|---|---|
| `weekStart`, `weekEnd` | string | Monday and Sunday of the week actually used |
| `data[].visitId` | number | Visit id |
| `data[].scheduledAt` | ISO datetime (UTC) | `visits.scheduled_at` |
| `data[].actualDate` | `YYYY-MM-DD` \| null | `visits.actual_date` |
| `data[].status` | VisitStatus | `visits.status` |
| `data[].quoteGenerated`, `orderGenerated` | boolean | Commercial outcome of the visit (HU-27) |
| `data[].client` | `{ id, commercialName }` | Client |
| `data[].zone` | `{ id, name }` | Client's zone (territory) |
| `data[].advisor` | `{ id, name }` | Advisor (`name` null if the user no longer exists) |
| `data[].route` | `{ id, name }` \| null | Route the visit came from, if any |
| `meta` | `{ total, page, limit, totalPages, hasNextPage, hasPreviousPage }` | Shared pagination meta |

**Errors:** `400` invalid filter (date, ids, status, order) · `401` no session · `403` advisor (`ASESOR`).

**Real response** (local database with the HU-42 demo seed, admin, `?weekStart=2026-10-19&territoryId=1&limit=2`):

```json
{
  "weekStart": "2026-10-19",
  "weekEnd": "2026-10-25",
  "data": [
    {
      "visitId": 1,
      "scheduledAt": "2026-10-19T08:00:00.000Z",
      "actualDate": "2026-10-24",
      "status": "VISITED",
      "quoteGenerated": true,
      "orderGenerated": true,
      "client": { "id": 1, "commercialName": "Autoservicio El Prado" },
      "zone": { "id": 1, "name": "Barranquilla Norte" },
      "advisor": { "id": 3, "name": "Laura Martinez" },
      "route": { "id": 1, "name": "North weekly route" }
    },
    {
      "visitId": 2,
      "scheduledAt": "2026-10-19T09:00:00.000Z",
      "actualDate": "2026-10-24",
      "status": "VISITED",
      "quoteGenerated": false,
      "orderGenerated": false,
      "client": { "id": 2, "commercialName": "Distribuidora Alto Prado" },
      "zone": { "id": 1, "name": "Barranquilla Norte" },
      "advisor": { "id": 3, "name": "Laura Martinez" },
      "route": { "id": 1, "name": "North weekly route" }
    }
  ],
  "meta": { "total": 6, "page": 1, "limit": 2, "totalPages": 3, "hasNextPage": true, "hasPreviousPage": false }
}
```

## 4. Query

Two parameterized queries share the same `FROM`/`WHERE`: one counts the rows (and returns the week), the other returns the page with `ORDER BY v.scheduled_at, v.id` and `LIMIT/OFFSET`. Each optional filter is `($n IS NULL OR column = $n)`. The order direction is mapped to the literals `ASC`/`DESC`; no user input is concatenated into the SQL. Every join is many-to-one (client, zone, user, route), so no visit is duplicated.

## 5. Tests

Run against an isolated, throwaway local PostgreSQL 17 (all `develop` migrations + HU-42 demo seed).

| Check | Result |
|---|---|
| `npm run build` | OK |
| `npm run lint` | Exit 0; 153 warnings, all pre-existing (same as `develop`), none in `tracking` |
| `npm run test` | 115 files / 641 tests passed (`develop`: 111 / 626). Tracking: 15 tests in 4 files |
| `npm run test:e2e` | 3 files / 28 tests passed (18 are `test/tracking.e2e-spec.ts`) |

- **Unit:** use case (filters passed through, director zone forced), controller (query mapping, page/limit defaults and cap, roles metadata), query DTO (valid and invalid values), DAO (row mapping, pagination meta, SQL parameters, `LIMIT/OFFSET`, order, empty page).
- **E2E:** real HTTP + Better Auth login + PostgreSQL with its own data in two new zones (removed afterwards): 401 / 403, director never sees another zone, every column of a row, week boundaries in Bogotá time, any day → its week, empty week, filters by status / route / advisor, descending order, page 2 with its meta, 400 for invalid filters, totals compared with an independent SQL count.

## 6. Pending

1. **Confirm the columns against the design** ("Columnas del diseño"); adding or removing a column is a change in the DAO select and the response DTO.
2. The status labels and the "Pedido cerrado" legend are presentation decisions for the frontend (see §1).
3. Indexes on `visits.scheduled_at` if the table grows (owned by the visit module).
