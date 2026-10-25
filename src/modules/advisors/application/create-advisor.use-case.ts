import { Injectable } from '@nestjs/common';
import { Advisor } from '../domain/advisor.entity.js';
import { AdvisorDao } from '../domain/advisor.dao.js';
import {
  AdvisorEmailAlreadyExistsError,
  AdvisorNotFoundError,
  AdvisorZoneNotFoundError,
} from '../domain/advisor.errors.js';
import { AdvisorAccountPort } from './ports/advisor-account.port.js';

export interface CreateAdvisorInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  documentNumber?: string | null;
  zoneId?: number | null;
  weeklyVisitGoal?: number | null;
}

/** Creates the login account (role ASESOR) and the advisor profile (HU-07). */
@Injectable()
export class CreateAdvisorUseCase {
  constructor(
    private readonly advisorDao: AdvisorDao,
    private readonly accountPort: AdvisorAccountPort,
  ) {}

  async execute(input: CreateAdvisorInput): Promise<Advisor> {
    const email = input.email.trim().toLowerCase();
    if (await this.advisorDao.isEmailTaken(email)) {
      throw new AdvisorEmailAlreadyExistsError(email);
    }
    if (
      input.zoneId != null &&
      !(await this.advisorDao.zoneExists(input.zoneId))
    ) {
      throw new AdvisorZoneNotFoundError(input.zoneId);
    }

    const userId = await this.accountPort.createAccount({
      name: input.name,
      email,
      password: input.password,
    });

    const created = await this.advisorDao.findById(userId);
    if (!created) {
      throw new AdvisorNotFoundError(userId);
    }

    created.update({
      phone: input.phone ?? null,
      documentNumber: input.documentNumber ?? null,
      zoneId: input.zoneId ?? null,
      weeklyVisitGoal: input.weeklyVisitGoal ?? null,
    });
    created.activate();

    return this.advisorDao.save(created);
  }
}
