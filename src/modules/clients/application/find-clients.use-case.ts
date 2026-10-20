import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientFilterCriteria } from '../domain/client-filter.criteria.js';
import { ClientRepository } from '../domain/client.repository.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

@Injectable()
export class FindClientsUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(
    criteria: ClientFilterCriteria,
  ): Promise<PaginatedResult<Client>> {
    return this.clientRepository.findPaginated(criteria);
  }
}

