import { Injectable, UnauthorizedException } from '@nestjs/common';

import {
  CurrentAdvisorProvider,
  CurrentAdvisorRequest,
} from '../domain/current-advisor.provider.js';

// TEMPORARY placeholder while Better Auth is not available.
// When the real authentication lands:
// 1. Replace this adapter with one that reads the authenticated session/JWT
//    from the request instead of the x-user-id header.
// 2. Keep CurrentAdvisorProvider.extract() as the single entry point so
//    controllers and use cases do not need to change.
@Injectable()
export class HeaderCurrentAdvisorProvider implements CurrentAdvisorProvider {
  async extract(request: CurrentAdvisorRequest): Promise<number> {
    const value = request.headers['x-user-id'];

    if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
      throw new UnauthorizedException('Authenticated advisor is required.');
    }

    const advisorId = Number.parseInt(value.trim(), 10);

    if (advisorId <= 0) {
      throw new UnauthorizedException('Authenticated advisor is required.');
    }

    return advisorId;
  }
}
