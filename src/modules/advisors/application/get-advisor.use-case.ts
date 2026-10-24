import { Injectable } from '@nestjs/common';
import { Advisor } from '../domain/advisor.entity.js';
import { AdvisorRepository } from '../domain/advisor.repository.js';
import { AdvisorNotFoundError } from '../domain/advisor.errors.js';
import {
  CurrentActor,
  scopeForActor,
} from '../../../shared/auth/domain/current-actor.provider.js';

@Injectable()
export class GetAdvisorUseCase {
  constructor(private readonly advisorRepository: AdvisorRepository) {}

  async execute(userId: number, actor?: CurrentActor): Promise<Advisor> {
    const advisor = await this.advisorRepository.findById(userId);
    const { zoneId } = scopeForActor(actor);
    if (!advisor || (zoneId !== undefined && advisor.zoneId !== zoneId)) {
      throw new AdvisorNotFoundError(userId);
    }
    return advisor;
  }
}
