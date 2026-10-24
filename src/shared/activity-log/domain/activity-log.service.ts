export interface ActivityLogEntry {
  action: string;
  entityType: string;
  entityId: number | string;
  actorId: number;
  /** Client the action belongs to. Falls back to `metadata.clientId`. */
  clientId?: number | null;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Abstract port to record client activity log entries (HU-15) from any
 * module (client changes, visits, quotes, orders, follow-ups, ...).
 */
export abstract class ActivityLogService {
  abstract record(entry: ActivityLogEntry): Promise<void>;
}
