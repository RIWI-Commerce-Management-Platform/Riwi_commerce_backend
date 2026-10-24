# Épica E3: Planeación de Rutas Comerciales

**Responsable (Owner):** Alejandro  
**Módulo:** Comercial 360 — Backend Core (`src/modules/routes/`)  
**Arquitectura:** Clean Architecture (Hexagonal / Ports & Adapters)  
**Base de Datos:** PostgreSQL con TypeORM  
**Historias de Usuario:** HU-17, HU-18, HU-19, HU-20, HU-21, HU-22  

---

## 🎯 Objetivo de mi Épica

Centralizar y optimizar la planeación logística y comercial del Director Regional:
1. Diseñar rutas semanales por territorio/zona en un asistente guiado de 3 pasos (**Wizard**).
2. Asignar y secuenciar dinámicamente las paradas de clientes en el recorrido comercial con reordenamiento para el mapa interactivo (**Leaflet + OpenStreetMap**).
3. Estimar distancias en kilómetros y tiempos de atención y traslado (**Algoritmo Haversine / OSRM**).
4. Asignar la ruta a un asesor comercial de la zona, disparando la creación automática de visitas programadas en la agenda de Camilo (**Épica E4**).
5. Administrar el ciclo de vida de las rutas con control de accesos territorial (**RBAC por Zona**).

---

## 📋 Historias de Usuario a mi Cargo

| ID | Historia de Usuario | Prioridad | Estado | Capa Actual |
|:---:|:---|:---:|:---:|:---|
| **HU-17** | Crear ruta con datos generales (Paso 1 Wizard, Borrador) | **Alta** | ✅ **Completada** | `POST /routes`, `PATCH /routes/:id` |
| **HU-18** | Agregar clientes y reordenar paradas (Paso 2 Wizard) | **Alta** | ✅ **Completada** | `POST /routes/:id/stops`, `DELETE /routes/:id/stops/:clientId`, `PATCH /routes/:id/stops/reorder` |
| **HU-19** | Visualizar ruta y secuencia en mapa (Leaflet + OSM) | **Alta** | ✅ **Completada** | `GET /routes/:id` (coordenadas enriquecidas) + reordenamiento |
| **HU-20** | Asignar ruta a asesor y programar visitas en agenda (Paso 3) | **Alta** | ✅ **Completada** | `POST /routes/:id/assign` (inserta en `visits` de Camilo) |
| **HU-21** | Listar y supervisar rutas asignadas con filtros y estados | **Media** | ✅ **Completada** | `GET /routes`, `PATCH /routes/:id/status` |
| **HU-22** | Resumen de distancia y tiempo estimado de viaje | **Baja** | ✅ **Completada** | `POST /routes/metrics/calculate`, recálculo automático |

---

## 🏛️ 1. Capa de Dominio (`src/modules/routes/domain/`)

Siguiendo estrictamente la regla de dependencias de Clean Architecture, mi capa de dominio no importa NestJS, TypeORM ni ninguna biblioteca externa. Solo contiene lógica de negocio pura y tipos de TypeScript.

### Entidades y Agregados
- [`Route`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/domain/route.entity.ts): Raíz de agregado que encapsula las propiedades de la tabla `routes` (`name`, `zoneId`, `advisorId`, `dayOfWeek`, `frequency`, `startTime`, `endTime`, `startDate`, `endDate`, `status`, `totalDistanceKm`, `estimatedDurationMinutes`, `isActive`).
  - `addStop(clientId, suggestedTime, duration)`: Incorpora una parada al final y le asigna el siguiente número consecutivo.
  - `removeStop(clientId)`: Remueve la parada y reindexa inmediatamente las paradas restantes para que la secuencia sea siempre continua (1, 2, 3...).
  - `reorderStops(orderedClientIds)`: Reordena las paradas según la secuencia enviada desde el mapa/drag-and-drop del frontend.
  - `assignAdvisor(advisorId)`: Valida que la ruta tenga paradas y esté activa, pasando el estado a `ASSIGNED`.
  - `updateMetrics(distanceKm, durationMinutes)`: Registra el cálculo de ruta.
  - `deactivate()` / `activate()`: Gestión de borrado lógico (soft delete).
- [`RouteStop`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/domain/route-stop.entity.ts): Entidad para `route_stops` (`clientId`, `visitOrder`, `suggestedTime`, `estimatedDurationMinutes`).

### Enumeraciones y Objetos de Valor
- [`RouteStatus`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/domain/route-status.enum.ts): `DRAFT`, `ASSIGNED`, `INACTIVE`.
- [`DayOfWeek`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/domain/day-of-week.enum.ts): `MONDAY` a `SUNDAY`.
- [`RouteFrequency`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/domain/route-frequency.enum.ts): `WEEKLY`, `BIWEEKLY`, `MONTHLY`.
- [`RouteFilterCriteria`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/domain/route-filter.criteria.ts): Contrato de filtrado dinámico para supervisión.

### Puerto de Persistencia
- [`RouteRepository`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/domain/route.repository.ts): Clase abstracta que define los métodos `findById`, `findByNameAndZone`, `findPaginated`, `save` y `delete`.

---

## ⚙️ 2. Capa de Aplicación (`src/modules/routes/application/`)

La capa de aplicación orquesta la interacción entre mis entidades de dominio y los servicios externos mediante puertos de entrada y salida:

### Puertos de Integración (Ports)
1. [`RouteClientReaderPort`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/ports/route-client-reader.port.ts): Permite consultar los clientes y sus coordenadas (`latitude`, `longitude`, `zoneId`) sin acoplarme directamente a la persistencia de Yesid (E2).
2. [`VisitSchedulerPort`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/ports/visit-scheduler.port.ts): Contrato de integración para que al asignar un asesor, se generen automáticamente las visitas en la agenda de Camilo (E4).
3. [`RouteDistanceCalculatorPort`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/ports/route-distance-calculator.port.ts): Desacopla el algoritmo de cálculo geodésico (Haversine/OSRM) para obtener distancia y duración.

### Casos de Uso Implementados
1. [`CreateRouteDraftUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/create-route-draft.use-case.ts) (HU-17): Valida unicidad de nombre en la zona, autorizaciones del Director Regional y crea la ruta en estado `DRAFT`.
2. [`UpdateRouteDraftUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/update-route-draft.use-case.ts) (HU-17 y HU-21): Modifica metadatos de la ruta respetando las zonas y nombres únicos.
3. [`AddRouteStopUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/add-route-stop.use-case.ts) (HU-18 y HU-22): Agrega paradas de clientes garantizando que pertenezcan a la zona de la ruta y recalcula la distancia y tiempo estimado.
4. [`RemoveRouteStopUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/remove-route-stop.use-case.ts) (HU-18): Elimina la parada, reindexa correlativamente las demás y recalcula métricas.
5. [`ReorderRouteStopsUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/reorder-route-stops.use-case.ts) (HU-18 y HU-19): Soporte técnico para el drag-and-drop del frontend y el mapa interactivo.
6. [`AssignRouteAdvisorUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/assign-route-advisor.use-case.ts) (HU-20): Valida paradas existentes, asigna el asesor (`ASSIGNED`) y llama a `VisitSchedulerPort` para generar visitas.
7. [`CalculateRouteMetricsUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/calculate-route-metrics.use-case.ts) (HU-22): Previsualización de métricas de trayecto.
8. [`FindRoutesUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/find-routes.use-case.ts) (HU-21): Listado paginado con seguridad territorial automática.
9. [`GetRouteByIdUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/get-route-by-id.use-case.ts) (HU-19): Retorna la ruta con paradas enriquecidas con coordenadas para pintar marcadores y polilíneas en Leaflet.
10. [`ToggleRouteStatusUseCase`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/application/toggle-route-status.use-case.ts) (HU-21): Soft delete y reactivación de rutas.

---

## 💾 3. Capa de Infraestructura (`src/modules/routes/infrastructure/`)

En esta capa implemento la persistencia relacional en PostgreSQL mediante TypeORM y los adaptadores concretos para los puertos de aplicación:

### Entidades ORM y Mapper
- [`RouteOrmEntity`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/infrastructure/route.orm-entity.ts): Mapeo a la tabla `routes` con columnas `snake_case`, clave foránea a `zones(id)` e índices optimizados.
- [`RouteStopOrmEntity`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/infrastructure/route-stop.orm-entity.ts): Mapeo a `route_stops` con clave foránea a `clients(id)` y restricción única `(route_id, client_id)`.
- [`RouteMapper`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/infrastructure/route.mapper.ts): Conversión bidireccional pura entre entidades TypeORM y entidades de dominio.

### Repositorio TypeORM
- [`TypeOrmRouteRepository`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/infrastructure/typeorm-route.repository.ts): Implementación transaccional de `RouteRepository` utilizando `DataSource.transaction` para garantizar que la ruta y sus paradas se sincronicen de manera atómica sin paradas huérfanas.

### Adaptadores de Puertos (Adapters)
- [`TypeOrmRouteClientReaderAdapter`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/infrastructure/typeorm-route-client-reader.adapter.ts): Consume `ClientRepository` para proveer coordenadas geográficas y datos de clientes a mis casos de uso.
- [`HaversineRouteDistanceCalculatorAdapter`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/infrastructure/haversine-route-distance-calculator.adapter.ts): Calcula distancia geodésica acumulada con factor de trazado urbano (1.3x) y velocidad promedio (25 km/h).
- [`TypeOrmVisitSchedulerAdapter`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/infrastructure/typeorm-visit-scheduler.adapter.ts): Proyecta las visitas en el calendario según día y frecuencia, insertándolas en la tabla `visits` (Camilo E4) en estado `PENDING`.

### Migración de Base de Datos
- [`1792670000000-CreateRoutesTables.ts`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/infrastructure/migrations/1792670000000-CreateRoutesTables.ts): Creación de tablas `routes` y `route_stops`, claves foráneas con `CASCADE`/`RESTRICT`, índices y vínculo a `visits`.

---

## 🌐 4. Capa de Presentación (`src/modules/routes/presentation/`)

En esta capa expongo la API REST documentada en OpenAPI/Swagger y protegida con guards de sesión y roles:

### Controlador y Endpoints
- [`RoutesController`](file:///C:/Users/pffal/Documents/RIWI/Backend/nestjs/Comercial%20360%20%E2%80%94%20Backend/Riwi_commerce_backend/src/modules/routes/presentation/routes.controller.ts):
  - `@UseGuards(SessionGuard, RolesGuard)`: Protege todas las rutas requiriendo sesión activa y verificación de roles.
  - `@Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)`: Restringe la creación y modificación a directores y administradores.
  - `@Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN, UserRole.ASESOR)`: Permite la consulta de rutas a asesores y directores.

### Tabla de Endpoints Expuestos

| Método | Ruta | Descripción | Historia de Usuario | Roles Permitidos |
|---|---|---|:---:|---|
| `POST` | `/routes` | Crear ruta comercial en borrador (Paso 1 del Wizard) | HU-17 | Director Regional, Admin |
| `GET` | `/routes` | Listar rutas con filtros por zona, asesor y estado (Paginado) | HU-21 | Director Regional, Admin, Asesor |
| `GET` | `/routes/:id` | Detalle de ruta con paradas enriquecidas con coordenadas (Leaflet) | HU-19, HU-21 | Director Regional, Admin, Asesor |
| `PATCH` | `/routes/:id` | Actualizar datos generales de la ruta | HU-17, HU-21 | Director Regional, Admin |
| `PATCH` | `/routes/:id/status` | Alternar estado activo/inactivo (Soft delete) | HU-21 | Director Regional, Admin |
| `POST` | `/routes/:id/stops` | Agregar cliente como parada a la ruta (Paso 2 del Wizard) | HU-18 | Director Regional, Admin |
| `DELETE` | `/routes/:id/stops/:clientId` | Remover una parada de cliente y reindexar secuencia | HU-18 | Director Regional, Admin |
| `PATCH` | `/routes/:id/stops/reorder` | Reordenar paradas (soporte drag-and-drop y mapa) | HU-18, HU-19 | Director Regional, Admin |
| `POST` | `/routes/:id/assign` | Asignar asesor y programar visitas en agenda (Paso 3) | HU-20 | Director Regional, Admin |
| `POST` | `/routes/metrics/calculate` | Previsualizar distancia y tiempo estimado de clientes | HU-22 | Director Regional, Admin |

### DTOs Validados
- `CreateRouteDraftDto`, `UpdateRouteDraftDto`, `AddRouteStopDto`, `ReorderRouteStopsDto`, `AssignRouteAdvisorDto`, `CalculateMetricsDto`, `FindRoutesQueryDto`.
- Todos decorados con `class-validator` y Swagger (`@ApiProperty`).
- `RouteResponseDto` serializa el agregado y enriquece las paradas con los datos del cliente (`commercialName`, `address`, `municipality`, `latitude`, `longitude`).

---

## 🧪 Pruebas Automatizadas

- **Total de pruebas en el módulo de rutas:** **86 pruebas unitarias** pasando al 100% (18 archivos de prueba).
- **Total global de la suite del proyecto:** **378 pruebas pasando** (77 archivos de prueba).
- **Linter (`oxlint`):** 0 errores.
- **Compilación (`nest build`):** Exitosa con 0 errores de TypeScript.
