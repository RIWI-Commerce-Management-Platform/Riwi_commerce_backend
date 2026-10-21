import { Module } from '@nestjs/common';

import { ActivityLogService } from './domain/activity-log.service.js';

import { NoopActivityLogService } from './infrastructure/noop-activity-log.service.js';

@Module({
  providers: [
    {
      provide: ActivityLogService,
      useClass: NoopActivityLogService,
    },
  ],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
