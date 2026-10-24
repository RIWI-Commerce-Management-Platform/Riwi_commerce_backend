import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  AuthenticatedRequest,
  CurrentAdvisorProvider,
} from '../domain/current-advisor.provider.js';

/**
 * Resolves the advisor from the Better Auth session. The global SessionGuard
 * has already validated the session and set `request.user` with a numeric id.
 */
@Injectable()
export class SessionCurrentAdvisorProvider implements CurrentAdvisorProvider {
  async extract(request: object): Promise<number> {
    const id = (request as AuthenticatedRequest).user?.id;
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedException('An authenticated session is required.');
    }
    return id;
  }
}
