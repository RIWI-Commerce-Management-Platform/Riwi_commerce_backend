import { Injectable } from '@nestjs/common';
import { Advisor } from '../domain/advisor.entity.js';
import { AdvisorDao } from '../domain/advisor.dao.js';
import { AdvisorNotFoundError } from '../domain/advisor.errors.js';
import { AdvisorAccountPort } from './ports/advisor-account.port.js';

export interface ChangeAdvisorStatusInput {
  userId: number;
  isActive: boolean;
}

/**
 * Activates or deactivates an advisor; there is no physical delete (HU-07).
 * Deactivating signs them out everywhere and blocks new sign-ins.
 */
@Injectable()
export class ChangeAdvisorStatusUseCase {
  constructor(
    private readonly advisorDao: AdvisorDao,
    private readonly accountPort: AdvisorAccountPort,
  ) {}

  async execute(input: ChangeAdvisorStatusInput): Promise<Advisor> {
    const advisor = await this.advisorDao.findById(input.userId);
    if (!advisor) {
      throw new AdvisorNotFoundError(input.userId);
    }

    if (input.isActive) {
      advisor.activate();
    } else {
      advisor.deactivate();
    }
    const saved = await this.advisorDao.save(advisor);

    if (!input.isActive) {
      await this.accountPort.revokeSessions(input.userId);
    }
    return saved;
  }
}
