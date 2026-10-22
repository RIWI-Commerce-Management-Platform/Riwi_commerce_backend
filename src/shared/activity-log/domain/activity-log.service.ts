export interface ActivityLogEntry {
  action: string;
  entityType: string;
  entityId: number | string;
  actorId: number | string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Abstract port to record customer/activity log entries from any module
 * (visit start, visit result, quotes, follow-ups, ...).
 */
export abstract class ActivityLogService {
  abstract record(entry: ActivityLogEntry): Promise<void>;
}
