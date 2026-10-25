import { Injectable } from '@nestjs/common';
import { Advisor } from '../domain/advisor.entity.js';
import { AdvisorDao } from '../domain/advisor.dao.js';
import { AdvisorNotFoundError } from '../domain/advisor.errors.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

@Injectable()
export class GetAdvisorUseCase {
  constructor(private readonly advisorDao: AdvisorDao) {}

  async execute(userId: number, actor?: CurrentActor): Promise<Advisor> {
    const advisor = await this.advisorDao.findById(userId);
    const { zoneId } = scopeForActor(actor);
    if (!advisor || (zoneId !== undefined && advisor.zoneId !== zoneId)) {
      throw new AdvisorNotFoundError(userId);
    }
    return advisor;
  }
}
