import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardDao } from './domain/dao/dashboard.dao.js';
import { TypeOrmDashboardDao } from './infrastructure/dao/typeorm-dashboard.dao.js';
import { GetDashboardKpisUseCase } from './application/use-cases/get-dashboard-kpis.use-case.js';
import { DashboardController } from './presentation/dashboard.controller.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    // Needed by RolesGuard
    TypeOrmModule.forFeature([UserOrmEntity]),
    SharedAuthModule,
  ],
  controllers: [DashboardController],
  providers: [
    GetDashboardKpisUseCase,
    { provide: DashboardDao, useClass: TypeOrmDashboardDao },
  ],
})
export class DashboardModule {}
