import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingDao } from './domain/dao/tracking.dao.js';
import { TypeOrmTrackingDao } from './infrastructure/dao/typeorm-tracking.dao.js';
import { ListTrackingVisitsUseCase } from './application/use-cases/list-tracking-visits.use-case.js';
import { TrackingController } from './presentation/tracking.controller.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    // Needed by RolesGuard
    TypeOrmModule.forFeature([UserOrmEntity]),
    SharedAuthModule,
  ],
  controllers: [TrackingController],
  providers: [
    ListTrackingVisitsUseCase,
    { provide: TrackingDao, useClass: TypeOrmTrackingDao },
  ],
})
export class TrackingModule {}
