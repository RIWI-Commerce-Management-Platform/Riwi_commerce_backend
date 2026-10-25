import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisorDao } from './domain/advisor.dao.js';
import { AdvisorAccountPort } from './application/ports/advisor-account.port.js';
import { CreateAdvisorUseCase } from './application/create-advisor.use-case.js';
import { ListAdvisorsUseCase } from './application/list-advisors.use-case.js';
import { GetAdvisorUseCase } from './application/get-advisor.use-case.js';
import { UpdateAdvisorUseCase } from './application/update-advisor.use-case.js';
import { ChangeAdvisorStatusUseCase } from './application/change-advisor-status.use-case.js';
import { AdvisorOrmEntity } from './infrastructure/advisor.orm-entity.js';
import { TypeOrmAdvisorDao } from './infrastructure/typeorm-advisor.dao.js';
import { BetterAuthAdvisorAccountAdapter } from './infrastructure/better-auth-advisor-account.adapter.js';
import { AdvisorsController } from './presentation/advisors.controller.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { SessionOrmEntity } from '../auth/infrastructure/session.orm-entity.js';
import { ZoneOrmEntity } from '../zones/infrastructure/zone.orm-entity.js';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdvisorOrmEntity,
      // Also needed by RolesGuard
      UserOrmEntity,
      SessionOrmEntity,
      ZoneOrmEntity,
    ]),
    SharedAuthModule,
  ],
  controllers: [AdvisorsController],
  providers: [
    CreateAdvisorUseCase,
    ListAdvisorsUseCase,
    GetAdvisorUseCase,
    UpdateAdvisorUseCase,
    ChangeAdvisorStatusUseCase,
    { provide: AdvisorDao, useClass: TypeOrmAdvisorDao },
    { provide: AdvisorAccountPort, useClass: BetterAuthAdvisorAccountAdapter },
  ],
  exports: [AdvisorDao, CreateAdvisorUseCase],
})
export class AdvisorsModule {}
