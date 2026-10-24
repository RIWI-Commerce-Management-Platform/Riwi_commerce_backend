import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientFilterCriteria } from '../domain/client-filter.criteria.js';
import { ClientRepository } from '../domain/client.repository.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

@Injectable()
export class FindClientsUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  /**
   * A regional director is limited to their zone (HU-06). Advisors still see
   * every client because they quote and visit across zones.
   */
  async execute(
    criteria: ClientFilterCriteria,
    actor?: CurrentActor,
  ): Promise<PaginatedResult<Client>> {
    const { zoneId } = scopeForActor(actor);
    return this.clientRepository.findPaginated(
      zoneId === undefined ? criteria : { ...criteria, zoneId },
    );
  }
}
