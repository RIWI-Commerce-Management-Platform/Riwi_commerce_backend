import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsDao } from './domain/reports.dao.js';
import { TypeOrmReportsDao } from './infrastructure/typeorm-reports.dao.js';
import { ExportReportUseCase } from './application/export-report.use-case.js';
import { ReportsController } from './presentation/reports.controller.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    // Needed by RolesGuard
    TypeOrmModule.forFeature([UserOrmEntity]),
    SharedAuthModule,
  ],
  controllers: [ReportsController],
  providers: [
    ExportReportUseCase,
    { provide: ReportsDao, useClass: TypeOrmReportsDao },
  ],
})
export class ReportsModule {}
