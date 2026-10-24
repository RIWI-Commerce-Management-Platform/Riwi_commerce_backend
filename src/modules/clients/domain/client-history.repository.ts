import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

/** A client activity log row ("Last interactions" view, HU-15). */
export interface ClientHistoryEntry {
  id: number;
  clientId: number;
  userId: number;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export abstract class ClientHistoryRepository {
  abstract findByClientId(
    clientId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ClientHistoryEntry>>;
}
