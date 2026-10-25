import { Injectable } from '@nestjs/common';
import { Advisor, UpdateAdvisorProps } from '../domain/advisor.entity.js';
import { AdvisorDao } from '../domain/advisor.dao.js';
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
  constructor(private readonly advisorDao: AdvisorDao) {}

  async execute(input: UpdateAdvisorInput): Promise<Advisor> {
    const advisor = await this.advisorDao.findById(input.userId);
    if (!advisor) {
      throw new AdvisorNotFoundError(input.userId);
    }

    const { userId, ...changes } = input;
    if (changes.email !== undefined) {
      changes.email = changes.email.trim().toLowerCase();
      if (
        changes.email !== advisor.email &&
        (await this.advisorDao.isEmailTaken(changes.email, userId))
      ) {
        throw new AdvisorEmailAlreadyExistsError(changes.email);
      }
    }
    if (
      changes.zoneId != null &&
      !(await this.advisorDao.zoneExists(changes.zoneId))
    ) {
      throw new AdvisorZoneNotFoundError(changes.zoneId);
    }

    advisor.update(changes);
    return this.advisorDao.save(advisor);
  }
}
