import { Client } from './client.entity.js';
import { ClientFilterCriteria } from './client-filter.criteria.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

export abstract class ClientRepository {
  abstract save(client: Client): Promise<Client>;
  abstract findById(id: number): Promise<Client | null>;
  abstract findByNit(nit: string): Promise<Client | null>;
  abstract findPaginated(
    criteria: ClientFilterCriteria,
  ): Promise<PaginatedResult<Client>>;
}
