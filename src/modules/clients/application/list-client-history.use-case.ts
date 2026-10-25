import { Injectable } from '@nestjs/common';
import { ClientDao } from '../domain/client.dao.js';
import {
  ClientHistoryEntry,
  ClientHistoryDao,
} from '../domain/client-history.dao.js';
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
    private readonly clientDao: ClientDao,
    private readonly historyDao: ClientHistoryDao,
  ) {}

  async execute(
    input: ListClientHistoryInput,
  ): Promise<PaginatedResult<ClientHistoryEntry>> {
    const client = await this.clientDao.findById(input.clientId);
    if (!client) {
      throw new ClientNotFoundError(input.clientId);
    }

    return this.historyDao.findByClientId(
      input.clientId,
      input.page,
      input.limit,
    );
  }
}
