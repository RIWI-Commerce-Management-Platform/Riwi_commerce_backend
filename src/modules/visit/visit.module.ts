import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { VisitDao } from './domain/dao/visit.dao.js';

import { VisitOrmEntity } from './infrastructure/visit.orm-entity.js';

import { TypeOrmVisitDao } from './infrastructure/dao/typeorm-visit.dao.js';

import { GetVisitAgendaUseCase } from './application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from './application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from './application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from './application/use-cases/register-visit-result.use-case.js';

import { VisitsController } from '../visit/presentation/controllers/visit.controller.js';
import { TestUsersController } from './presentation/controllers/test-users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([VisitOrmEntity])],
  controllers: [VisitsController, TestUsersController],
  providers: [
    {
      provide: VisitDao,
      useClass: TypeOrmVisitDao,
    },
    GetVisitAgendaUseCase,
    GetVisitByIdUseCase,
    StartVisitUseCase,
    RegisterVisitResultUseCase,
  ],
  exports: [VisitDao],
})
export class VisitsModule {}
