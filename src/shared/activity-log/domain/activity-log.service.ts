export interface ActivityLogEntry {
  action: string;
  entityType: string;
  entityId: number | string;
  actorId: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Abstract port to record customer/activity log entries from any module
 * (visit start, visit result, quotes, follow-ups, ...).
 */
export abstract class ActivityLogService {
  abstract record(entry: ActivityLogEntry): Promise<void>;
  abstract register(
    clientId: number,
    action: string,
    description: string,
    user: string | number,
  ): Promise<void>;
}
