# HU-35 — Weekly KPI Dashboard

**Owner:** Valery · **Epic:** E6 — Dashboard and Visit Map · **Priority:** High
**Branches:** backend `feat/HU-35-complete-dashboard`, frontend `feat/HU-35-dashboard`

## 1. Goal

> As a director, I want to see the week's KPIs so that I can make decisions.

A director opens one page and sees six numbers for a week, for one territory or for all of them, read live from PostgreSQL.

## 2. Acceptance criteria

| Criterion | Status |
|---|---|
| Scheduled visits card | Done and verified |
| Completed visits card | Done and verified |
| Effectiveness (%) card | Done and verified — **formula provisional** |
| Quoted amount card | Done and verified — **status rule provisional** |
| Closed orders card | Done and verified — **definition provisional** |
| Revenue ("facturación") card | **Blocked**: no invoicing data source. Returns `null`, the card says "No disponible" |
| Filter by territory | Done and verified |
| Filter by week | Done and verified |
| Frontend connected to the real API | Done and verified |

## 3. Architecture

Same pattern as the read-only `indicators` module (HU-39/HU-40): abstract DAO, TypeORM DAO with parameterized SQL, use case, controller with `RolesGuard`, query DTO with class-validator.

```text
src/modules/dashboard/
├── domain/
│   ├── dao/dashboard.dao.ts          # contract: getWeeklyMetrics(filters)
│   └── dashboard-kpis.ts             # types + BUSINESS_TIMEZONE
├── application/use-cases/
│   └── get-dashboard-kpis.use-case.ts  # territory by role, effectiveness, revenue = null
├── infrastructure/dao/
│   └── typeorm-dashboard.dao.ts      # the SQL query
├── presentation/
│   ├── dto/dashboard-filters.dto.ts  # query validation
│   ├── dto/dashboard-kpis-response.dto.ts  # Swagger response contract (like indicators)
│   └── dashboard.controller.ts       # GET /dashboard/kpis
└── dashboard.module.ts               # registered in AppModule
```

No tables or migrations were added. It reads `visits`, `quotes`, `orders`, `clients`, and reuses `effectiveness()` from `indicators` and `scopeForActor()` from `shared/auth`.

**Frontend** (`Riwi_commerce_frontend`, same structure as `features/auth`):

```text
src/features/dashboard/
├── pages/DashboardPage.jsx           # page: filters, loading, error, six cards
├── components/KpiCard/               # one card
├── components/DashboardFilters/      # week and territory selectors
├── hooks/useDashboardKpis.js         # filters state + calls the service
├── services/dashboardService.js      # fetch to the API with the session cookie
└── utils/dashboardFormat.js          # Monday of a week, COP and % formats
```

`App.jsx` shows the dashboard at `/#/dashboard` and the login everywhere else (no router yet). `vite.config.js` proxies `/api` to the backend in development, so the session cookie works.

## 4. Endpoint

```http
GET /dashboard/kpis?weekStart=2026-10-22&territoryId=1
```

| Parameter | Rules |
|---|---|
| `weekStart` (optional) | `YYYY-MM-DD`, a real date. **Any day** of the week is accepted; the week starts on its Monday (same convention as HU-39 `weekly-goal`). Default: the current week. |
| `territoryId` (optional) | Positive integer (zone id). Omitted = every territory. |

Real response (demo seed, admin):

```json
{
  "weekStart": "2026-10-19",
  "weekEnd": "2026-10-25",
  "territoryId": 1,
  "scheduledVisits": 6,
  "completedVisits": 2,
  "effectiveness": 33.3,
  "quotedAmount": "418000.00",
  "closedOrders": 1,
  "revenue": null
}
```

| Status | When |
|---|---|
| 200 | KPIs of the week |
| 400 | Invalid `weekStart` (format or impossible date such as `2026-02-30`) or `territoryId` |
| 401 | No session |
| 403 | The user is an advisor (`ASESOR`) |

## 5. Query and calculations

One SQL query in `typeorm-dashboard.dao.ts`:

1. `date_trunc('week', day)` turns the requested day (or today in Bogotá) into its **Monday**.
2. The week is `[Monday 00:00, next Monday 00:00)` **in America/Bogota** (`AT TIME ZONE`), so the result does not depend on the server or Docker timezone.
3. Each KPI is a separate subquery joined only to `clients` (many-to-one), so no row is counted twice.

| KPI | Calculation |
|---|---|
| Scheduled visits | `COUNT` of `visits` with `scheduled_at` in the week (any status) |
| Completed visits | Same, with `status = 'VISITED'` |
| Effectiveness | `completed / scheduled × 100`, one decimal (`indicators/effectiveness.ts`); `null` if nothing was scheduled. **Provisional** |
| Quoted amount | `SUM(quotes.total)` of quotes created in the week, every status (same as HU-40). Returned as exact decimal text. **Provisional** |
| Closed orders | Orders created in the week whose status is not `CANCELLED` (same as HU-40 `ordersCount`). **Provisional**: the project has no explicit "closed" status |
| Revenue | Not calculated: `null` |

## 6. Filters and security

- **Territory** = the client's zone (`clients.zone_id`), like `GET /indicators/by-zone`. A zone that does not exist simply returns zeros.
- **Roles:** `RolesGuard` + `@Roles(ADMIN, DIRECTOR_REGIONAL)`. An admin sees any territory. A regional director **always gets their own zone** (`scopeForActor`, same as HU-40), even if they ask for another one; the frontend shows a notice. An advisor gets 403; no session gets 401.
- Every value goes to SQL as a parameter (`$1`, `$2`, `$3`).

## 7. Tests

Run against an isolated local PostgreSQL 17 with all `develop` migrations and the HU-42 demo seed.

| Check | Result |
|---|---|
| Backend `npm run build` | OK |
| Backend `npm run lint` | Exit 0; 153 warnings, all pre-existing, none from the dashboard |
| Backend `npm run test` | 113 files / 640 tests passed (dashboard: 16 tests in 4 files) |
| Backend `npm run test:e2e` | 3 files / 25 tests passed (15 are the dashboard) |
| Frontend `npm test` / `npm run build` | 12 tests passed / OK |

- **Unit:** use case (six KPIs, effectiveness, empty week, admin and director scope), controller (delegation, roles), DTO (valid and invalid dates and ids), DAO (row mapping, SQL parameters).
- **Integration (`test/dashboard.e2e-spec.ts`):** real HTTP + Better Auth login + PostgreSQL. It inserts known data in two new zones and removes it after. Checks exact KPIs (zone A: 4 / 2 / 50 % / `3000.36` / 2), week boundaries (Monday 00:00 in, next Monday 00:00 out, Sunday 23:59 in Bogotá = Monday in UTC out), any day → its Monday, cancelled orders excluded, quote items not duplicating amounts, 401/403, director scope, empty week, invalid filters. Every result is also compared with an independent SQL query.
- **Frontend:** service (URL, cookie, error messages) and page (six cards with backend data, filters, loading, error, empty effectiveness, director notice).
- **Manual, real browser:** headless Chrome against the running backend: cards equal the API for every territory and for zone 1; previous week shows zeros; one column at 390 px; director sees only zone 1; advisor sees the permission message; `/` still shows the login.

## 8. Pending

1. **Revenue (blocked):** there is no invoice/billing entity in the ER model or the code. The business must define the source (invoicing module, ERP, or an explicit rule such as "delivered orders").
2. **Business approval** of the provisional rules: effectiveness formula, which quote statuses count, and what a "closed order" is (status and date).
3. **Login redirect (HU-08):** the login does not navigate to the dashboard yet; open `/#/dashboard`.
4. **Production:** needs the `/api` reverse proxy (or `VITE_API_URL` + `FRONTEND_URL` for CORS).
5. Indexes on `visits.scheduled_at`, `quotes.created_at`, `orders.created_at` if the tables grow (owned by other modules).
