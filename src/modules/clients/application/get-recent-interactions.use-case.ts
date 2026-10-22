import { Injectable } from '@nestjs/common';
import { ClientHistoryRepository } from '../domain/client-history.repository.js';
import { ClientHistory } from '../domain/client-history.entity.js';

@Injectable()
export class GetRecentInteractionsUseCase {
  constructor(
    private readonly clientHistoryRepository: ClientHistoryRepository,
  ) {}

  async execute(limit?: number): Promise<ClientHistory[]> {
    return this.clientHistoryRepository.findRecent(limit);
  }
}
