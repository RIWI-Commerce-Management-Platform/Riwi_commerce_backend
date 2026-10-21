# Epic E2: Clients, Catalogs & Activity Log — Implementation Summary

**Author / Module Lead:** Yesid  
**Scope:** Backend (NestJS, PostgreSQL, TypeORM) & Cross-Module Contracts  
**Architecture:** Strict Clean Architecture (Hexagonal / Ports & Adapters)  

---

## 1. Architectural Foundation & Shared Standards

Before detailing individual user stories, the foundation for the module was established following Clean Architecture principles:
- **Domain Layer:** Pure TypeScript classes with business invariants, domain errors, and repository interfaces (abstract classes). Strictly zero dependencies on NestJS, TypeORM, or external frameworks.
- **Application Layer:** Isolated use cases orchestrating domain rules and communicating via ports.
- **Infrastructure Layer:** TypeORM persistence entities, mappers, database migrations, and external service adapters.
- **Presentation Layer:** REST controllers, validated DTOs, and OpenAPI / Swagger documentation.
- **Shared Utilities (`src/shared/pagination/`):** Generic pagination model (`PaginatedResult<T>`, `PaginationQueryDto`, `PaginatedResponseDto<T>`) designed to standardize paginated responses across the entire engineering team.
- **HTTP Method Standard:** In compliance with project guidelines, all modification operations are implemented using **`PATCH`** instead of `PUT` to reflect partial, safe resource updates.

---

## 2. User Story HU-11: Register and Edit Clients

### What was done?
- **Domain Layer (`src/modules/clients/domain/`):**
  - Created the pure `Client` entity with business attributes (`nit`, `businessName`, `commercialName`, `address`, `department`, `municipality`, `neighborhood`, `phone`, `email`, `zoneId`, `clientTypeId`, `potentialId`, `clientStatusId`, `visitFrequencyDays`, `latitude`, `longitude`, `isActive`).
  - Added domain methods: `activate()`, `deactivate()`, and `update()`.
  - Defined the abstract port `ClientRepository` (`save`, `findById`, `findByNit`).
  - Defined explicit domain exceptions: `ClientNitAlreadyExistsError` and `ClientNotFoundError`.
- **Application Layer (`src/modules/clients/application/`):**
  - Defined the `GeocodingPort` abstraction.
  - Implemented `CreateClientUseCase`: Enforces NIT uniqueness and automatically resolves geographical coordinates via geocoding when latitude/longitude are omitted.
  - Implemented `UpdateClientUseCase`: Verifies existence, validates NIT conflicts, updates mutable fields, and re-geocodes coordinates if address details change.
  - Implemented `ToggleClientStatusUseCase`: Provides logical soft-deletion without physical data removal.
- **Infrastructure Layer (`src/modules/clients/infrastructure/`):**
  - Created `ClientOrmEntity` mapped to the `clients` PostgreSQL table with snake_case naming conventions.
  - Implemented `ClientMapper` for bidirectional translation between domain and persistence models.
  - Created `TypeOrmClientRepository` implementing `ClientRepository`.
  - Implemented `NominatimGeocodingAdapter` consuming the OpenStreetMap (Nominatim) public API using native Node.js `fetch` with timeout and custom User-Agent.
  - Created migration `CreateClientsTable1792505831167`.
- **Presentation Layer (`src/modules/clients/presentation/`):**
  - Created `CreateClientDto`, `UpdateClientDto`, `ToggleClientStatusDto`, and `ClientResponseDto` with full Swagger annotations.
  - Implemented `ClientsController` with:
    - `POST /clients` (201 Created / 409 Conflict)
    - `PATCH /clients/:id` (200 OK / 404 Not Found / 409 Conflict)
    - `PATCH /clients/:id/status` (200 OK / 404 Not Found)

### Why was it done?
- **Business Invariants:** Clients must have a unique Colombian tax identification number (`NIT`) to prevent duplicate commercial accounts and fragmented transaction histories.
- **Auditability & Data Safety:** Commercial systems must preserve audit trails; permanent row deletion breaks historical quotes, visits, and invoices. Hence, soft deletion (`is_active: false`) was implemented.
- **Automated Spatial Resolution:** Manually entering latitude and longitude in commercial platforms is error-prone and tedious for sales advisors. Geocoding Colombian street addresses automatically eliminates friction.

### What was it done for?
- Centralizes client master data within a single source of truth.
- Provides accurate geolocations so that subsequent modules (Commercial Routes, Advisor Daily Agendas, and Leaflet Maps) can plot clients on interactive maps.

---

## 3. User Story HU-12: Search, Filter, and Paginated Clients

### What was done?
- **Shared Utilities (`src/shared/pagination/`):**
  - Built `PaginationQueryDto` with sanitized `page` and `limit` defaults (page 1, limit 10, max 100).
  - Built generic `PaginatedResult<T>` and OpenAPI-compatible `PaginatedResponseDto<T>`.
- **Domain Layer:**
  - Created `ClientFilterCriteria` domain interface for dynamic query parameters.
  - Extended `ClientRepository` with `findPaginated(criteria: ClientFilterCriteria)`.
- **Application Layer:**
  - Implemented `FindClientsUseCase` to orchestrate multi-criteria querying.
  - Implemented `GetClientByIdUseCase` to retrieve single client details.
- **Infrastructure Layer:**
  - In `TypeOrmClientRepository`, implemented `findPaginated` using TypeORM `createQueryBuilder`:
    - Case-insensitive substring search matching NIT, commercial name, or business name (`LOWER(...) LIKE :search`).
    - Exact relational filters for `zone_id`, `client_type_id`, `potential_id`, `municipality`, and `is_active`.
    - Server-side pagination using `.skip((page - 1) * limit).take(limit)` and descending sort by creation date.
- **Presentation Layer:**
  - Created `FindClientsQueryDto` and `PaginatedClientResponseDto`.
  - Implemented endpoints in `ClientsController`:
    - `GET /clients`: Paginated list exposing complete client metadata, including `latitude` and `longitude`.
    - `GET /clients/:id`: Full single-client detail.

### Why was it done?
- **Performance & Scalability:** Querying large datasets without pagination strains database I/O and server memory. Using SQL-level `.skip()` and `.take()` guarantees constant-time memory overhead.
- **Inter-Module Contract Fulfillment:** The architecture team defined a mandatory contract where Epic E2 must provide `GET /clients` with filters and coordinates to unblock:
  - **Alejandro (Epic E3 - Routes):** Needs client locations to compute itinerary distances and optimize stops.
  - **Valery (Epic E6 - Dashboard):** Needs client coordinates to render OpenStreetMap/Leaflet markers.

### What was it done for?
- Allows commercial advisors to rapidly search clients by commercial name or tax ID.
- Allows regional directors to segment customers by city, territory zone, or potential classification.

---

## 4. User Story HU-13: Manage Client Contacts

### What was done?
- **Domain Layer (`src/modules/clients/domain/`):**
  - Created `ClientContact` pure entity (`id`, `clientId`, `name`, `position`, `phone`, `mobile`, `email`, `isPrimary`, `isActive`, `createdAt`, `updatedAt`).
  - Added business methods: `markAsPrimary()`, `demoteFromPrimary()`, `deactivate()`, `activate()`, and `update()`.
  - Defined abstract `ClientContactRepository` (`save`, `findById`, `findByClientId`, `unsetPrimaryByClientId`).
  - Defined `ClientContactNotFoundError`.
- **Application Layer (`src/modules/clients/application/`):**
  - Implemented `CreateClientContactUseCase`: Validates parent client existence. **Enforces single primary contact rule**: if the new contact is marked primary (or is the client's first contact), all previously designated primary contacts for that client are automatically demoted.
  - Implemented `UpdateClientContactUseCase`: Applies updates using `PATCH` semantics; if promoted to primary, automatically demotes prior primary contacts.
  - Implemented `ListClientContactsUseCase`: Returns all active contacts for a client with the primary contact sorted first.
  - Implemented `SetPrimaryContactUseCase`: Fast-track action to designate a contact as primary.
  - Implemented `DeleteClientContactUseCase`: Soft deletes the contact and unsets primary status.
- **Infrastructure Layer (`src/modules/clients/infrastructure/`):**
  - Created `ClientContactOrmEntity` mapped to `client_contacts` table with `ManyToOne` foreign key referencing `clients(id)` with `ON DELETE CASCADE`.
  - Prevented circular dependency cycles between `ClientOrmEntity` and `ClientContactOrmEntity` to preserve ESM runtime stability in Node 24.
  - Created `TypeOrmClientContactRepository` utilizing batch `UPDATE` queries for atomic primary demotion.
  - Created migration `CreateClientContactsTable1792505831168`.
- **Presentation Layer (`src/modules/clients/presentation/`):**
  - Created `CreateClientContactDto`, `UpdateClientContactDto`, and `ClientContactResponseDto`.
  - Implemented `ClientContactsController` as a RESTful sub-resource under `/clients/:clientId/contacts`:
    - `POST /clients/:clientId/contacts`
    - `GET /clients/:clientId/contacts`
    - `PATCH /clients/:clientId/contacts/:contactId` (using `PATCH`)
    - `PATCH /clients/:clientId/contacts/:contactId/primary`
    - `DELETE /clients/:clientId/contacts/:contactId`

### Why was it done?
- **Organizational Realities:** Companies deal with multiple contacts (e.g., Purchasing Manager, Store Manager, Accountant). However, operational routing and commercial follow-ups require a single primary interlocutor to prevent duplicate communications.
- **Business Rule Enforcement:** The project specification explicitly mandates that **only one contact can be primary per client**. The domain logic and repository transactions ensure this rule cannot be violated, automatically demoting previous primaries upon designation of a new one.

### What was it done for?
- Equips sales representatives with verified contact directories per corporate client.
- Provides immediate identification of the key decision-maker when scheduling visits and dispatching quotes.

---

## 5. Summary Table of Implemented Endpoints

| HTTP Method | Path | Description | Associated Story |
|---|---|---|---|
| `POST` | `/clients` | Register a new client with automated geocoding | HU-11 |
| `PATCH` | `/clients/:id` | Update client details and recalculate coordinates | HU-11 |
| `PATCH` | `/clients/:id/status` | Toggle client active/inactive status (Soft delete) | HU-11 |
| `GET` | `/clients` | Search and filter clients with server pagination & coordinates | HU-12 |
| `GET` | `/clients/:id` | Retrieve single client by ID | HU-12 |
| `POST` | `/clients/:clientId/contacts` | Create contact (enforces single primary rule) | HU-13 |
| `GET` | `/clients/:clientId/contacts` | List all active contacts for client (primary first) | HU-13 |
| `PATCH` | `/clients/:clientId/contacts/:contactId` | Update contact information | HU-13 |
| `PATCH` | `/clients/:clientId/contacts/:contactId/primary` | Designate contact as primary | HU-13 |
| `DELETE` | `/clients/:clientId/contacts/:contactId` | Soft delete contact person | HU-13 |

---

## 6. Quality & Verification Metrics
- **TypeScript strict mode:** 0 errors under NodeNext ESM.
- **Static code analysis (`oxlint`):** 0 errors, 0 warnings across all files.
- **Unit test suite (`vitest`):** Fully isolated test coverage across domain entities, use cases, mappers, and controllers.
- **OpenAPI / Swagger:** Full schema definitions, parameter documentation, and response statuses available at `/docs`.
