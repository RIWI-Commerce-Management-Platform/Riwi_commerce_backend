export interface ActivityLogEntry {
  action: string;
  entityType: string;
  entityId: number | string;
  actorId: number | string;
  clientId?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Abstract port to record customer/activity log entries from any module
 * (visit start, visit result, quotes, follow-ups, ...).
 */
export abstract class ActivityLogService {
  abstract record(entry: ActivityLogEntry): Promise<void>;

  async register(
    clientId: number,
    action: string,
    description: string,
    user: string | number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.record({
      clientId,
      action,
      description,
      actorId: user,
      entityType: 'client',
      entityId: clientId,
      metadata,
    });
  }
}
