import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { auth } from '../../auth/auth.js';
import { SessionOrmEntity } from '../../auth/infrastructure/session.orm-entity.js';
import {
  AdvisorAccountPort,
  CreateAdvisorAccountInput,
} from '../application/ports/advisor-account.port.js';
import { AdvisorAccountCreationError } from '../domain/advisor.errors.js';

/**
 * Creates advisor accounts through Better Auth so the password is hashed
 * and the credential account is created the same way as a normal sign-up.
 * New users get the ASESOR role by default.
 */
@Injectable()
export class BetterAuthAdvisorAccountAdapter implements AdvisorAccountPort {
  constructor(
    @InjectRepository(SessionOrmEntity)
    private readonly sessionRepository: Repository<SessionOrmEntity>,
  ) {}

  async createAccount(input: CreateAdvisorAccountInput): Promise<number> {
    let userId: number;
    try {
      const result = await auth.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
      });
      userId = Number(result.user.id);
    } catch (error: any) {
      throw new AdvisorAccountCreationError(
        error?.body?.message || error?.message,
      );
    }

    // Sign-up signs the new user in; the admin creating them doesn't need
    // that session.
    await this.revokeSessions(userId);
    return userId;
  }

  async revokeSessions(userId: number): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }
}
