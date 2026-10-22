import type { ClientHistory } from './client-history.entity.js';
import type { ClientHistoryFilterCriteria } from './client-history-filter.criteria.js';
import type { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

export abstract class ClientHistoryRepository {
  abstract save(history: ClientHistory): Promise<ClientHistory>;
  abstract findByClientId(
    clientId: number,
    criteria?: ClientHistoryFilterCriteria,
  ): Promise<PaginatedResult<ClientHistory>>;
  abstract findRecent(limit?: number): Promise<ClientHistory[]>;
  abstract findById(id: number): Promise<ClientHistory | null>;
}
