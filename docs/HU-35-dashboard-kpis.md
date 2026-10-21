# HU-35 — Weekly KPI Dashboard

**Owner:** Valery  
**Epic:** E6 — Dashboard and Visit Map  
**Priority:** High  
**Status:** In progress (partial backend implementation)  
**Implementation branch:** `feat/HU-35-dashboard-kpis`  


> **User story:** As a director, I want to see the week's KPIs so that I can make decisions.

## 1. Acceptance Criteria

HU-35 requires **six KPI cards**: scheduled visits, completed visits, effectiveness (%), quoted amount, closed orders, and revenue. The results must be **filterable by territory and week**.

| Criterion | Status | Evidence / outstanding work |
|---|---|---|
| Show scheduled visits | Pending integration | `scheduledVisits` defined; real query and UI are missing |
| Show completed visits | Pending integration | `completedVisits` defined; real query and UI are missing |
| Show effectiveness (%) | Pending definition and integration | `effectiveness` defined; calculation formula not yet agreed |
| Show quoted amount | Pending integration | `quotedAmount` defined; real query is missing |
| Show closed orders | Pending definition and integration | `closedOrders` defined; qualifying order status not yet agreed |
| Show revenue | Pending definition and integration | `revenue` defined; data source and reporting date rules not yet agreed |
| Filter by territory | Partial | Optional `territoryId` defined; zone mapping and authorization remain to be confirmed |
| Filter by week | Partial | `weekStart` defined; Monday, timezone, and weekly interval validation are missing |
| Display a connected dashboard UI | Pending | Team frontend has not yet been integrated |

**Note:** Defining KPI fields does not mean that the metrics are being calculated or displayed yet.

## 2. Current Branch Implementation

```text
src/modules/dashboard/
├── domain/
│   ├── dashboard-kpis.ts
│   └── dao/
│       └── dashboard.dao.ts
├── application/
│   └── use-cases/
│       ├── get-dashboard-kpis.use-case.ts
│       └── get-dashboard-kpis.use-case.spec.ts
└── presentation/
    ├── dashboard.controller.ts
    ├── dashboard.controller.spec.ts
    └── dto/
        └── dashboard-filters.dto.ts
```

### Domain

`DashboardKpis` defines the output structure:

- `scheduledVisits: number`
- `completedVisits: number`
- `effectiveness: number`
- `quotedAmount: number`
- `closedOrders: number`
- `revenue: number`

`DashboardFilters` defines `weekStart: string` and `territoryId?: string`. `DashboardDao` declares the abstract contract `getKpis(filters): Promise<DashboardKpis>`. This module follows the agreed **DAO** naming convention without renaming or changing other modules' conventions.

### Application

`GetDashboardKpisUseCase` receives the DAO through its constructor and delegates the query to `dashboardDao.getKpis(filters)`. **Business metric calculations and filter validation have not been implemented.**

### Presentation

`DashboardController` declares `GET /dashboard/kpis` and delegates to the use case. `DashboardFiltersDto` documents the query parameters using Swagger decorators.

**Current limitation:** Although the controller declares a route, **the HTTP endpoint is not yet operational**. `DashboardModule` must be registered, dependencies must be wired, and a concrete DAO implementation is still required.

## 3. Proposed HTTP Contract (Not Yet Integrated)

```http
GET /dashboard/kpis?weekStart=2026-10-19&territoryId=1
```

`territoryId` is optional. `weekStart` is expected to use `YYYY-MM-DD` and represent the Monday of the requested week. **This requirement is not yet enforced in code.**

**Illustrative response — not retrieved from the database:**

```json
{
  "scheduledVisits": 24,
  "completedVisits": 19,
  "effectiveness": 79.17,
  "quotedAmount": 215450000,
  "closedOrders": 8,
  "revenue": 128760000
}
```

The meanings of `effectiveness`, `closedOrders`, and `revenue` require functional confirmation before real queries are implemented. The example does not establish an effectiveness formula or represent actual project figures.

## 4. Tests and Verification

**Verified locally:**

- `npm run build` — NestJS build completed successfully after adding the use case and controller.
- `npm run test -- src/modules/dashboard/application/use-cases/get-dashboard-kpis.use-case.spec.ts` — **1 test passed**, validating DAO delegation and the mocked result.

**Test code published on GitHub:**

- `get-dashboard-kpis.use-case.spec.ts` — use case test with a mocked DAO.
- `dashboard.controller.spec.ts` — controller test with a mocked use case.

**Not confirmed by the available evidence:** Local or CI execution of the controller test; connection to PostgreSQL/RDS; a running HTTP endpoint; rendered Swagger documentation; role-based authorization; E2E tests; or working frontend KPI cards. The presence of `.spec.ts` files does not establish that every test was run.

## 5. Integration Dependencies

| Owner | HU-35 dependency |
|---|---|
| Luis | Synchronize the integration branch; confirm filter contract, timezone, shared module architecture, and PR review |
| Efrain | Authentication, roles, and territory/advisor access restrictions |
| Yesid | Client entity and client-to-territory (zone) relationship |
| Camilo | Scheduled/completed visits and final visit statuses |
| Carlos | Quotes, orders, amounts, and final order statuses |
| Frontend team | Frontend scaffold, KPI cards, and shared week/territory filters |
| Valentina | Align HU-35 metrics with reporting/indicators in HU-38 and HU-40 |

### Technical Risks Identified Across Branches

- In `feature/HU-11`, the client primary key is numeric, as is the visit `clientId`. However, the quote `clientId` in `feature-HU-30` is a UUID. **Module owners need to align these contracts** before aggregate queries are implemented.
- Camilo's visit module defines `PENDING`, `IN_PROGRESS`, `VISITED`, `RESCHEDULE`, and `NOT_VISITED`. These are the exact values to use once his module is integrated.
- The quote/order relationship to advisors and territories, and revenue attribution rules, still require confirmation.

## 6. Next Steps

1. Agree on the business definitions of effectiveness, closed orders, and revenue.
2. Validate `weekStart` and filters, including role-based data access.
3. Add `DashboardModule` and configure dependency injection once a real DAO implementation is available.
4. Implement a read-only `TypeOrmDashboardDao` using integrated entities.
5. Add calculation tests and HTTP integration tests.
6. Build six KPI cards and filters in the frontend repository and consume the real endpoint.
7. Verify results using demonstration data and run E2E tests.
8. Request a Pull Request review; do not merge changes without team approval.

## 7. Scope and Notes

HU-35 covers **both backend and frontend**; the current work provides only the backend foundation. No new database tables or changes to teammates' modules have been introduced. HU-36 (visit map), HU-37 (tracking table), and HU-41 (Jenkins pipeline) must be documented separately and must not be marked complete based on HU-35 progress.
