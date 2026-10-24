import { Injectable } from '@nestjs/common';
import { ClientRepository } from '../domain/client.repository.js';
import {
  ClientHistoryEntry,
  ClientHistoryRepository,
} from '../domain/client-history.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

export interface ListClientHistoryInput {
  clientId: number;
  page: number;
  limit: number;
}

/** Latest interactions recorded for a client, newest first (HU-15). */
@Injectable()
export class ListClientHistoryUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly historyRepository: ClientHistoryRepository,
  ) {}

  async execute(
    input: ListClientHistoryInput,
  ): Promise<PaginatedResult<ClientHistoryEntry>> {
    const client = await this.clientRepository.findById(input.clientId);
    if (!client) {
      throw new ClientNotFoundError(input.clientId);
    }

    return this.historyRepository.findByClientId(
      input.clientId,
      input.page,
      input.limit,
    );
  }
}
