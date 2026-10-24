# Épica E1: Seguridad, Autenticación, Roles y Gestión de Asesores

**Responsable (Owner):** Efraín  
**Rama de Trabajo:** `feat/implement-security`  
**Módulos del Sistema:** `src/modules/auth/`, `src/modules/advisors/`, `src/shared/auth/`  
**Arquitectura:** Clean Architecture (Hexagonal / Ports & Adapters)  
**Base de Datos y Caché:** PostgreSQL (TypeORM) + Redis  
**Tecnologías de Autenticación:** Better Auth, JWT (`jsonwebtoken`), Nodemailer  

---

## 🎯 Objetivo de la Épica

Implementar el núcleo transversal de seguridad, control de acceso y gestión del personal comercial de **Comercial 360**:
1. Proveer autenticación segura con correo/contraseña y soporte para inicio de sesión social/Microsoft vía Better Auth.
2. Implementar un esquema híbrido y escalable de sesiones: Cookies HTTP-only para navegación web y tokens JWT (`accessToken` / `refreshToken`) con invalidación en Redis.
3. Asegurar los endpoints del sistema mediante control de acceso basado en roles (**RBAC**) y validación de pertenencia territorial (Zona).
4. Administrar el ciclo de vida de los **Asesores Comerciales** (`advisors`), vinculándolos estrechamente con las cuentas de usuario con rol `ASESOR`.
5. Proveer mecanismos confiables de autoservicio, como el restablecimiento de contraseñas olvidadas por correo electrónico.

---

## 📋 Historias de Usuario de la Épica E1

| ID | Historia de Usuario | Prioridad | Estado | Endpoints Principales |
|:---:|:---|:---:|:---:|:---|
| **HU-05** | Inicio de sesión con correo y contraseña, recordarme y cierre de sesión | **Alta** | ✅ **Completada** | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| **HU-06** | Control de acceso por roles (`ADMINISTRADOR`, `DIRECTOR_REGIONAL`, `ASESOR`, `CLIENTE`) y territorio | **Alta** | ✅ **Completada** | `PATCH /auth/users/:userId/role`, `SessionGuard`, `RolesGuard` |
| **HU-07** | CRUD y gestión de asesores comerciales vinculados a usuarios | **Alta** | ✅ **Completada** | `GET /advisors`, `POST /advisors`, `PATCH /advisors/:id`, `PATCH /advisors/:id/status` |
| **HU-08** | Autenticación basada en Tokens JWT con rotación y sesiones en Redis | **Alta** | ✅ **Completada** | `POST /auth/refresh`, `AuthTokenService`, `RedisService` |
| **HU-09** | Recuperación y restablecimiento de contraseña mediante correo | **Media** | ✅ **Completada** | `POST /auth/forgot-password`, `POST /auth/reset-password`, `PasswordResetMailer` |
| **HU-10** | Integración de Gateway de autenticación federada y compatibilidad Better Auth | **Media** | ✅ **Completada** | `BetterAuthGateway`, endpoints nativos `/api/auth/*` |

---

## 🏗️ Flujo de Autenticación y Autorización

```mermaid
flowchart TD
    subgraph Client["Cliente (Frontend / API)"]
        Req["Petición HTTP"]
    end

    subgraph SecurityGuards["Capa de Seguridad (NestJS Guards)"]
        SessionG["SessionGuard (Global)"]
        RolesG["RolesGuard (@Roles)"]
    end

    subgraph AuthEngines["Mecanismos de Validación"]
        CookieVal["Better Auth Session Cookie"]
        JWTVal["JWT Bearer Token (AuthTokenService)"]
        RedisStore[("Redis: Blacklist & Sesiones")]
    end

    subgraph CoreBusiness["Módulos de Negocio"]
        AuthCtrl["AuthController (/auth)"]
        AdvisorCtrl["AdvisorsController (/advisors)"]
        OtherModules["Rutas, Clientes, Cotizaciones, Visitas"]
    end

    Req --> SessionG
    SessionG -->|¿Ruta @Public()?| PassThrough["Permitir acceso"]
    SessionG -->|Header Cookie| CookieVal
    SessionG -->|Header Authorization: Bearer| JWTVal
    JWTVal <--> RedisStore
    CookieVal --> RolesG
    JWTVal --> RolesG
    RolesG -->|Valida Rol y Zona| AuthCtrl
    RolesG -->|Valida Rol y Zona| AdvisorCtrl
    RolesG -->|Valida Rol y Zona| OtherModules
```

---

## 🏛️ Estructura por Capas (Clean Architecture)

### 1. Capa de Dominio (`src/modules/auth/domain/` y `src/modules/advisors/domain/`)
- **`UserRole` (`user-role.enum.ts`):** Define los cuatro roles canónicos de la aplicación:
  - `ADMINISTRADOR`: Acceso global a catálogos, asesores, auditoría y asignación de roles.
  - `DIRECTOR_REGIONAL`: Gestión territorial de clientes y planeación de rutas para su zona (`zoneId`).
  - `ASESOR`: Ejecución operativa de visitas, consulta de clientes asignados y creación de cotizaciones.
  - `CLIENTE`: Acceso a consulta de sus propios pedidos y cotizaciones.
- **Errores de Dominio Expresivos:**
  - `InvalidCredentialsError`, `InvalidUserRoleError`, `RegistrationFailedError`, `UserNotFoundError`, `AdvisorNotFoundError`.

### 2. Capa de Aplicación (`src/modules/auth/application/` y `src/modules/advisors/application/`)
- **Casos de Uso Atómicos:**
  - `LoginUseCase`: Procesa el login contra Better Auth o credenciales locales, gestionando `rememberMe` y cookies.
  - `RegisterUseCase`: Registra nuevos usuarios con validación de correo único y asignación de rol inicial.
  - `LogoutUseCase`: Invalida la sesión activa tanto en Better Auth como en la lista de revocación de Redis.
  - `GetCurrentUserUseCase`: Resuelve la identidad del usuario y sincroniza su rol y zona desde la base de datos.
  - `AssignUserRoleUseCase`: Permite al Administrador cambiar roles y exige obligatoriamente un `zoneId` válido si el rol asignado es `DIRECTOR_REGIONAL`.
- **Servicios Especializados:**
  - `AuthService`: Orquesta la inicialización de roles, usuarios por defecto y compatibilidad de base de datos.
  - `AuthTokenService`: Genera pares de tokens (`accessToken` y `refreshToken`) firmados criptográficamente y gestiona su rotación.
  - `AdvisorService`: Implementa la lógica de negocio para crear, actualizar, listar y cambiar estado de asesores comerciales, garantizando que el `idUsuario` corresponda a un usuario existente con rol `ASESOR`.
  - `extract-set-cookies.ts`: Helper reutilizable con `parseAuthResponse` que desacopla la extracción segura de cookies y el parsing de respuestas sin duplicación de código.

### 3. Capa de Infraestructura (`src/modules/auth/infrastructure/` y `src/modules/advisors/infrastructure/`)
- **Persistencia TypeORM:**
  - `UserOrmEntity`: Mapeo de la tabla `user` con soporte para `role` (`varchar`) y `zoneId` (`integer`).
  - `AdvisorOrmEntity`: Mapeo de la tabla `advisors` (`id_asesor`, `nombre`, `correo`, `telefono`, `estado`, `id_usuario`).
- **Adaptadores y Servicios Externos:**
  - `RedisService`: Conexión de alto rendimiento con Redis para listas negras de tokens revocados y expiración de sesiones temporales.
  - `PasswordResetMailer`: Integración con Nodemailer para el envío transaccional de correos de recuperación de contraseña con enlace seguro y token firmado.
  - `BetterAuthGateway`: Fachada para desacoplar el core del framework Better Auth y permitir mockeo completo en pruebas unitarias.
- **Migraciones Automáticas:**
  - `1792641000000-AddUserRoles.ts`: Adiciona las columnas `role` y `zoneId` en la tabla `user`.
  - `1792661000000-CreateAdvisors.ts`: Crea la tabla `advisors` con constraints de unicidad en correo y llave foránea opcional a `user`.
  - `1792686000000-LinkAuthUsersToProfiles.ts`: Garantiza la consistencia referencial entre usuarios y asesores.

### 4. Capa de Presentación (`src/modules/auth/presentation/` y `src/modules/advisors/presentation/`)
- **`AuthController` (`/auth`):**
  - `POST /auth/login`: Autenticación con soporte de sesión persistente o por ventana de navegación.
  - `POST /auth/register`: Registro de nuevas cuentas.
  - `POST /auth/logout`: Cierre de sesión y revocación de tokens.
  - `GET /auth/me`: Perfil del usuario autenticado actual con sus permisos y zona asignada.
  - `PATCH /auth/users/:userId/role`: Endpoint administrativo para asignación de roles.
  - `POST /auth/refresh`: Renovación de `accessToken` mediante `refreshToken`.
  - `POST /auth/forgot-password` y `POST /auth/reset-password`: Flujo de recuperación de contraseña.
- **`AdvisorsController` (`/advisors`):**
  - `GET /advisors`: Listado completo de asesores comerciales (soporta filtro por estado).
  - `GET /advisors/:id`: Detalle de un asesor por ID.
  - `POST /advisors`: Creación de un nuevo asesor con validación de rol `ASESOR` en el usuario vinculado.
  - `PATCH /advisors/:id`: Actualización de datos de contacto o reasignación de usuario.
  - `PATCH /advisors/:id/status`: Activación/desactivación lógica (`estado: true/false`).
- **Guards del Sistema:**
  - `SessionGuard` (registrado globalmente como `APP_GUARD`): Valida tanto cookies de sesión como encabezados `Authorization: Bearer <JWT>`, protegiendo todas las rutas salvo aquellas marcadas con el decorador `@Public()`.
  - `RolesGuard`: Aplica RBAC a nivel de ruta utilizando el decorador `@Roles(UserRole.ADMINISTRADOR, ...)`.

---

## 🛡️ Estándares de Calidad y Resultados SonarQube

Tras la fase de estabilización, refactorización y cobertura exhaustiva, la rama cumple al 100% con los criterios de aceptación:

| Indicador | Meta / Umbral | Resultado Obtenido | Estado |
| :--- | :---: | :---: | :---: |
| **Quality Gate de SonarQube** | `PASSED` | **OK** | ✅ Aprobado |
| **Bugs** | `0` | **0** | ✅ Impecable |
| **Vulnerabilidades** | `0` | **0** | ✅ Impecable |
| **Code Smells** | `0` | **0** | ✅ Impecable |
| **Vulnerabilidades ReDoS (`S8786`)** | `0` | **0 (Eliminadas)** | ✅ Seguro |
| **Densidad de Duplicación (CPD)** | `< 3.0%` | **0.9%** | ✅ Óptimo |
| **Cobertura Global del Proyecto** | `> 80.0%` | **90.2%** | ✅ Excedido |
| **Cobertura de Código Nuevo** | `> 80.0%` | **87.1%** | ✅ Excedido |
| **Archivos en Rojo (< 80%)** | `0` | **0 (100% en verde)** | ✅ Impecable |
| **Suites de Pruebas Unitarias** | Todas pasando | **96 / 96 passed** | ✅ 522/522 tests |

---

## 🔗 Integración con las Demás Épicas

- **Con Épica E3 (Alejandro - Rutas):** Provee el `zoneId` del `DIRECTOR_REGIONAL` autenticado para filtrar las rutas visibles, y expone los asesores activos para el Paso 3 del Wizard de asignación (`POST /routes/:id/assign`).
- **Con Épica E2 (Yesid - Clientes):** Valida los permisos de modificación de clientes y contactos comerciales.
- **Con Épica E4 (Camilo - Visitas):** Vincula las visitas programadas con el `advisorId` correspondiente al usuario que ejecuta la aplicación móvil/web.
- **Con Épica E5 (Carlos - Cotizaciones y Pedidos):** Extrae de manera transversal la identidad del actor (`currentAdvisor.extract(request)`) para la firma y auditoría de cotizaciones y pedidos.
- **Con Épica E6 (Valery - Dashboard):** Provee la autenticación y restricción por roles para la visualización de los KPIs semanales por territorio.
