import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteOrmEntity } from './infrastructure/route.orm-entity.js';
import { RouteStopOrmEntity } from './infrastructure/route-stop.orm-entity.js';
import { VisitOrmEntity } from '../visit/infrastructure/visit.orm-entity.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { AdvisorOrmEntity } from '../advisors/infrastructure/advisor.orm-entity.js';
import { ClientsModule } from '../clients/clients.module.js';

import { RouteDao } from './domain/route.dao.js';
import { TypeOrmRouteDao } from './infrastructure/typeorm-route.dao.js';

import { RouteClientReaderPort } from './application/ports/route-client-reader.port.js';
import { TypeOrmRouteClientReaderAdapter } from './infrastructure/typeorm-route-client-reader.adapter.js';

import { RouteDistanceCalculatorPort } from './application/ports/route-distance-calculator.port.js';
import { HaversineRouteDistanceCalculatorAdapter } from './infrastructure/haversine-route-distance-calculator.adapter.js';

import { VisitSchedulerPort } from './application/ports/visit-scheduler.port.js';
import { TypeOrmVisitSchedulerAdapter } from './infrastructure/typeorm-visit-scheduler.adapter.js';

import { RouteAdvisorReaderPort } from './application/ports/route-advisor-reader.port.js';
import { TypeOrmRouteAdvisorReaderAdapter } from './infrastructure/typeorm-route-advisor-reader.adapter.js';

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
 * Commercial routes module (epic E3). Binds each port to its infrastructure
 * implementation and registers the use cases and the controller.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RouteOrmEntity,
      RouteStopOrmEntity,
      VisitOrmEntity,
      UserOrmEntity,
      AdvisorOrmEntity,
    ]),
    ClientsModule,
  ],
  controllers: [RoutesController],
  providers: [
    // Use cases
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

    // Ports bound to infrastructure adapters
    {
      provide: RouteDao,
      useClass: TypeOrmRouteDao,
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
    {
      provide: RouteAdvisorReaderPort,
      useClass: TypeOrmRouteAdvisorReaderAdapter,
    },

    // Auth guards
    SessionGuard,
    RolesGuard,
  ],
  exports: [RouteDao, FindRoutesUseCase, GetRouteByIdUseCase],
})
export class RoutesModule {}
