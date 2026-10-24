import { Injectable } from '@nestjs/common';
import { Advisor, UpdateAdvisorProps } from '../domain/advisor.entity.js';
import { AdvisorRepository } from '../domain/advisor.repository.js';
import {
  AdvisorEmailAlreadyExistsError,
  AdvisorNotFoundError,
  AdvisorZoneNotFoundError,
} from '../domain/advisor.errors.js';

export interface UpdateAdvisorInput extends UpdateAdvisorProps {
  userId: number;
}

@Injectable()
export class UpdateAdvisorUseCase {
  constructor(private readonly advisorRepository: AdvisorRepository) {}

  async execute(input: UpdateAdvisorInput): Promise<Advisor> {
    const advisor = await this.advisorRepository.findById(input.userId);
    if (!advisor) {
      throw new AdvisorNotFoundError(input.userId);
    }

    const { userId, ...changes } = input;
    if (changes.email !== undefined) {
      changes.email = changes.email.trim().toLowerCase();
      if (
        changes.email !== advisor.email &&
        (await this.advisorRepository.isEmailTaken(changes.email, userId))
      ) {
        throw new AdvisorEmailAlreadyExistsError(changes.email);
      }
    }
    if (
      changes.zoneId != null &&
      !(await this.advisorRepository.zoneExists(changes.zoneId))
    ) {
      throw new AdvisorZoneNotFoundError(changes.zoneId);
    }

    advisor.update(changes);
    return this.advisorRepository.save(advisor);
  }
}
