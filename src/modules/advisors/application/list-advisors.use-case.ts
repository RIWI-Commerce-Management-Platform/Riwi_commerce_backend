import { Injectable } from '@nestjs/common';
import { Advisor } from '../domain/advisor.entity.js';
import { AdvisorFilterCriteria, AdvisorDao } from '../domain/advisor.dao.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

/** Lists advisors; a regional director only sees the ones in their zone. */
@Injectable()
export class ListAdvisorsUseCase {
  constructor(private readonly advisorDao: AdvisorDao) {}

  async execute(
    criteria: AdvisorFilterCriteria,
    actor?: CurrentActor,
  ): Promise<PaginatedResult<Advisor>> {
    const { zoneId } = scopeForActor(actor);
    return this.advisorDao.findPaginated(
      zoneId === undefined ? criteria : { ...criteria, zoneId },
    );
  }
}
