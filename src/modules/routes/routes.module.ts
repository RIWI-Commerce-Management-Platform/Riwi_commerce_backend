import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteOrmEntity } from './infrastructure/route.orm-entity.js';
import { RouteStopOrmEntity } from './infrastructure/route-stop.orm-entity.js';
import { VisitOrmEntity } from '../visit/infrastructure/visit.orm-entity.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { ClientsModule } from '../clients/clients.module.js';

import { RouteRepository } from './domain/route.repository.js';
import { TypeOrmRouteRepository } from './infrastructure/typeorm-route.repository.js';

import { RouteClientReaderPort } from './application/ports/route-client-reader.port.js';
import { TypeOrmRouteClientReaderAdapter } from './infrastructure/typeorm-route-client-reader.adapter.js';

import { RouteDistanceCalculatorPort } from './application/ports/route-distance-calculator.port.js';
import { HaversineRouteDistanceCalculatorAdapter } from './infrastructure/haversine-route-distance-calculator.adapter.js';

import { VisitSchedulerPort } from './application/ports/visit-scheduler.port.js';
import { TypeOrmVisitSchedulerAdapter } from './infrastructure/typeorm-visit-scheduler.adapter.js';

import { CreateRouteDraftUseCase } from './application/create-route-draft.use-case.js';
import { UpdateRouteDraftUseCase } from './application/update-route-draft.use-case.js';
import { AddRouteStopUseCase } from './application/add-route-stop.use-case.js';
import { RemoveRouteStopUseCase } from './application/remove-route-stop.use-case.js';
import { ReorderRouteStopsUseCase } from './application/reorder-route-stops.use-case.js';
import { AssignRouteAdvisorUseCase } from './application/assign-route-advisor.use-case.js';
import { CalculateRouteMetricsUseCase } from './application/calculate-route-metrics.use-case.js';
import { FindRoutesUseCase } from './application/find-routes.use-case.js';
import { GetRouteByIdUseCase } from './application/get-route-by-id.use-case.js';
import { ToggleRouteStatusUseCase } from './application/toggle-route-status.use-case.js';

import { RoutesController } from './presentation/routes.controller.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

/**
 * Módulo de Rutas Comerciales (Épica E3 - Alejandro).
 * 
 * En este módulo configuro la inyección de dependencias de NestJS enlazando cada puerto abstracto
 * con su implementación correspondiente en infraestructura y registrando los casos de uso
 * y el controlador HTTP.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RouteOrmEntity,
      RouteStopOrmEntity,
      VisitOrmEntity,
      UserOrmEntity,
    ]),
    ClientsModule,
  ],
  controllers: [RoutesController],
  providers: [
    // Casos de uso de negocio
    CreateRouteDraftUseCase,
    UpdateRouteDraftUseCase,
    AddRouteStopUseCase,
    RemoveRouteStopUseCase,
    ReorderRouteStopsUseCase,
    AssignRouteAdvisorUseCase,
    CalculateRouteMetricsUseCase,
    FindRoutesUseCase,
    GetRouteByIdUseCase,
    ToggleRouteStatusUseCase,

    // Enlace de puertos a adaptadores de infraestructura
    {
      provide: RouteRepository,
      useClass: TypeOrmRouteRepository,
    },
    {
      provide: RouteClientReaderPort,
      useClass: TypeOrmRouteClientReaderAdapter,
    },
    {
      provide: RouteDistanceCalculatorPort,
      useClass: HaversineRouteDistanceCalculatorAdapter,
    },
    {
      provide: VisitSchedulerPort,
      useClass: TypeOrmVisitSchedulerAdapter,
    },

    // Guards de seguridad y autenticación
    SessionGuard,
    RolesGuard,
  ],
  exports: [
    RouteRepository,
    FindRoutesUseCase,
    GetRouteByIdUseCase,
  ],
})
export class RoutesModule {}
