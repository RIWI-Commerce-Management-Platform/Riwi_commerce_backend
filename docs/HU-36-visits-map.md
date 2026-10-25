# HU-36 — Visits map (backend)

**Owner:** Valery · **Epic:** E6 — Dashboard and Visit Map · **Priority:** High
**Source:** `docs/Comercial360_Historias_y_Reparto_v2.pdf`
**Branch:** `feat/HU-36-visits-map` (from `develop`)

> **User story:** As a director, I want a map of visits, to see the day's operation.
>
> **Acceptance criteria (source):** "Leaflet + OSM; marcadores por estado con la leyenda del diseño (Visitado, Pendiente, Sin visitar, Pedido cerrado, Reprogramado)."

## 1. Scope

| Criterion | Status |
|---|---|
| Data for markers by status with the five legend categories | Done and verified (backend) |
| Leaflet + OpenStreetMap map | Frontend (not in this repository) |

- **One marker per visit scheduled on the selected day** ("the day's operation"), Bogotá time.
- **Coordinates:** the visited **client's** `latitude` / `longitude` (HU-11, obtained with Nominatim). The backend never invents or estimates a position.
- **Not duplicated:** `GET /routes/:id` returns route stops with coordinates but no visits or statuses; `GET /clients` returns coordinates without visits. No endpoint returned the visits of a day with their location and legend category.
- **Reused:** `RolesGuard` + `@Roles`, `CurrentActorProvider` + `scopeForActor` (HU-06), the read-only DAO pattern of `indicators`. No enum, column or migration was added.

## 2. Legend categories (`mapStatus`)

"Pedido cerrado" is not a stored visit status, so the category is derived by `mapStatusOf()` in `domain/visit-map.ts`:

| Condition (stored data) | `mapStatus` | Legend |
|---|---|---|
| `order_generated = true` (HU-27; only settable on a visit in progress or done) | `ORDER_CLOSED` | Pedido cerrado |
| `status = VISITED` | `VISITED` | Visitado |
| `status = PENDING` or `IN_PROGRESS` | `PENDING` | Pendiente |
| `status = NOT_VISITED` | `NOT_VISITED` | Sin visitar |
| `status = RESCHEDULE` | `RESCHEDULED` | Reprogramado |

`ORDER_CLOSED` takes precedence. `IN_PROGRESS` is not in the legend: a started but unfinished visit is shown as pending (provisional, see §7). The raw `status` is also returned.

A rescheduled visit (HU-26) has its `scheduled_at` moved to the new date, so it appears as `RESCHEDULED` on its new day.

## 3. Visits without a location

If the client has no coordinates, or they are out of range (latitude not in [-90, 90] or longitude not in [-180, 180]), the visit is **still returned** with `location: null` and counted in `withoutLocation`. It is not drawn on the map; the frontend can list it next to the map. It is also counted in `total` and `counts`.

## 4. Architecture

```text
src/modules/visit-map/
├── domain/
│   ├── dao/visit-map.dao.ts         # contract: findDayVisits(filters)
│   └── visit-map.ts                 # MapStatus, mapStatusOf(), types, BUSINESS_TIMEZONE
├── application/use-cases/
│   └── get-visit-map.use-case.ts    # director's zone, mapStatus, counts
├── infrastructure/dao/
│   └── typeorm-visit-map.dao.ts     # parameterized SQL
├── presentation/
│   ├── dto/visit-map-query.dto.ts
│   ├── dto/visit-map-response.dto.ts
│   └── visit-map.controller.ts      # GET /visit-map
└── visit-map.module.ts              # registered in AppModule
```

The DAO runs one query for the day and one for the visits: `visits` joined to `clients`, `zones` (many-to-one), and left-joined to `"user"` and `routes`. The day is `[00:00, next day 00:00)` in America/Bogota (`AT TIME ZONE`). Every filter is a bound parameter (`$n IS NULL OR column = $n`). The territory is the client's zone, as in HU-35, HU-37 and HU-40.

## 5. Endpoint contract

```http
GET /visit-map?date=2026-10-19&territoryId=1
Cookie: better-auth.session_token=...
```

**Roles:** `ADMIN`, `DIRECTOR_REGIONAL`. A regional director always gets their own zone, whatever `territoryId` says.

| Query parameter | Rules |
|---|---|
| `date` | Optional. `YYYY-MM-DD`, a real date. Default: today in America/Bogota |
| `territoryId` | Optional. Integer > 0, the client's zone |
| `advisorId` | Optional. Integer > 0, the visit's advisor |

No pagination: it is a single day of visits.

**Response 200**

| Field | Type | Meaning |
|---|---|---|
| `date` | `YYYY-MM-DD` | Day actually used |
| `total` | number | Visits of the day |
| `withoutLocation` | number | Of those, without valid coordinates |
| `counts` | `{ VISITED, PENDING, NOT_VISITED, ORDER_CLOSED, RESCHEDULED }` | Visits per legend category (for the legend) |
| `data[].visitId` | number | Visit id |
| `data[].scheduledAt` | ISO datetime (UTC) | Scheduled time |
| `data[].status` | `PENDING` \| `IN_PROGRESS` \| `VISITED` \| `RESCHEDULE` \| `NOT_VISITED` | Stored status |
| `data[].mapStatus` | `VISITED` \| `PENDING` \| `NOT_VISITED` \| `ORDER_CLOSED` \| `RESCHEDULED` | Marker category (§2) |
| `data[].orderGenerated` | boolean | HU-27 |
| `data[].location` | `{ latitude: number, longitude: number }` \| null | WGS84 decimal degrees, ready for Leaflet `[latitude, longitude]` |
| `data[].client` | `{ id, commercialName, address, municipality }` | For the marker popup |
| `data[].zone` | `{ id, name }` | Client's zone |
| `data[].advisor` | `{ id, name }` | `name` null if the user no longer exists |
| `data[].route` | `{ id, name }` \| null | Route the visit came from, if any |

`data` is ordered by `scheduledAt`, then `visitId`.

**Errors:** `400` invalid `date`, `territoryId` or `advisorId` · `401` no session · `403` advisor (`ASESOR`).

**Real response** (local database with the HU-42 demo seed, admin, `?date=2026-10-19&territoryId=1`, first 2 of 6 markers):

```json
{
  "date": "2026-10-19",
  "total": 6,
  "withoutLocation": 0,
  "counts": { "VISITED": 1, "PENDING": 4, "NOT_VISITED": 0, "ORDER_CLOSED": 1, "RESCHEDULED": 0 },
  "data": [
    {
      "visitId": 1,
      "scheduledAt": "2026-10-19T08:00:00.000Z",
      "status": "VISITED",
      "mapStatus": "ORDER_CLOSED",
      "orderGenerated": true,
      "location": { "latitude": 10.9925, "longitude": -74.793 },
      "client": { "id": 1, "commercialName": "Autoservicio El Prado", "address": "Carrera 54 # 64-120", "municipality": "Barranquilla" },
      "zone": { "id": 1, "name": "Barranquilla Norte" },
      "advisor": { "id": 3, "name": "Laura Martinez" },
      "route": { "id": 1, "name": "North weekly route" }
    },
    {
      "visitId": 2,
      "scheduledAt": "2026-10-19T09:00:00.000Z",
      "status": "VISITED",
      "mapStatus": "VISITED",
      "orderGenerated": false,
      "location": { "latitude": 11.0035, "longitude": -74.809 },
      "client": { "id": 2, "commercialName": "Distribuidora Alto Prado", "address": "Calle 76 # 57-30", "municipality": "Barranquilla" },
      "zone": { "id": 1, "name": "Barranquilla Norte" },
      "advisor": { "id": 3, "name": "Laura Martinez" },
      "route": { "id": 1, "name": "North weekly route" }
    }
  ]
}
```

## 6. Tests

Run against an isolated, throwaway local PostgreSQL 17 (all `develop` migrations + HU-42 demo seed).

| Check | Result |
|---|---|
| `npm run build` | OK |
| `npm run lint` | Exit 0; 153 warnings, all pre-existing (same as `develop`), none in `visit-map` |
| `npm run test` | 115 files / 648 tests passed (`develop`: 111 / 626). Visit map: 22 tests in 4 files |
| `npm run test:e2e` | 3 files / 24 tests passed (14 are `test/visit-map.e2e-spec.ts`) |

- **Unit:** `mapStatusOf` (every status, order precedence, IN_PROGRESS), use case (categories, counts, `withoutLocation`, empty day, admin filters, director zone), DAO (row mapping, null location for missing and out-of-range coordinates, parameters), controller (delegation, roles), query DTO (valid and invalid values).
- **E2E:** real HTTP + Better Auth login + PostgreSQL with its own data in two new zones (removed afterwards): 401 / 403, director never sees another zone, one visit per legend category, full marker payload, null location for missing and out-of-range coordinates, day boundaries in Bogotá time, every territory, advisor filter, empty day, default day = today in Bogotá, 400 for invalid filters; totals and missing-location counts compared with an independent SQL query.

## 7. Pending

1. **Confirm with the business:** "Pedido cerrado" uses the visit's HU-27 `order_generated` flag; an alternative is "an order exists from a quote of the visit" (`quotes.visit_id` → `orders`, not cancelled). In the demo seed both give the same result.
2. **Confirm with the design:** how `IN_PROGRESS` visits should appear (now `PENDING`).
3. Indexes on `visits.scheduled_at` if the table grows (owned by the visit module).
