import { Injectable } from '@nestjs/common';
import { Advisor } from '../domain/advisor.entity.js';
import {
  AdvisorFilterCriteria,
  AdvisorRepository,
} from '../domain/advisor.repository.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

/** Lists advisors; a regional director only sees the ones in their zone. */
@Injectable()
export class ListAdvisorsUseCase {
  constructor(private readonly advisorRepository: AdvisorRepository) {}

  async execute(
    criteria: AdvisorFilterCriteria,
    actor?: CurrentActor,
  ): Promise<PaginatedResult<Advisor>> {
    const { zoneId } = scopeForActor(actor);
    return this.advisorRepository.findPaginated(
      zoneId === undefined ? criteria : { ...criteria, zoneId },
    );
  }
}
