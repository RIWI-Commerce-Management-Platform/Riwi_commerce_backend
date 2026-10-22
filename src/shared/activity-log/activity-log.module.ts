import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogService } from './domain/activity-log.service.js';
import { TypeOrmActivityLogService } from './infrastructure/typeorm-activity-log.service.js';
import { ClientHistoryOrmEntity } from '../../modules/clients/infrastructure/client-history.orm-entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ClientHistoryOrmEntity])],
  providers: [
    {
      provide: ActivityLogService,
      useClass: TypeOrmActivityLogService,
    },
  ],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
