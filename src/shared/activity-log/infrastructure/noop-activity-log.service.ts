import { Injectable, Logger } from '@nestjs/common';

import {
  ActivityLogEntry,
  ActivityLogService,
} from '../domain/activity-log.service.js';

// Placeholder implementation while the real activity log service is not
// available. Entries are only logged locally so the
// HU-24 audit criterion has a single, swappable integration point.
// When ActivityLogService finish:
// 1. Replace this adapter with one that persists to the real activity log.
// 2. Keep ActivityLogService as the port so use cases do not change.
@Injectable()
export class NoopActivityLogService implements ActivityLogService {
  private readonly logger = new Logger(NoopActivityLogService.name);

  async record(entry: ActivityLogEntry): Promise<void> {
    this.logger.log(
      `[activity-log] ${entry.action} ${entry.entityType}#${entry.entityId} by advisor#${entry.actorId}`,
    );
  }
}
