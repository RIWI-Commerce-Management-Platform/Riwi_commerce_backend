import { Injectable } from '@nestjs/common';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientHistoryRepository } from '../domain/client-history.repository.js';
import { ClientHistoryFilterCriteria } from '../domain/client-history-filter.criteria.js';
import { ClientHistory } from '../domain/client-history.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

@Injectable()
export class GetClientHistoryUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientHistoryRepository: ClientHistoryRepository,
  ) {}

  async execute(
    clientId: number,
    criteria?: ClientHistoryFilterCriteria,
  ): Promise<PaginatedResult<ClientHistory>> {
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError(clientId);
    }

    return this.clientHistoryRepository.findByClientId(clientId, criteria);
  }
}
