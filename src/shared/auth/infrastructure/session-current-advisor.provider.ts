import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

import {
  CurrentAdvisorProvider,
  CurrentAdvisorRequest,
} from '../domain/current-advisor.provider.js';

@Injectable()
export class SessionCurrentAdvisorProvider implements CurrentAdvisorProvider {
  async extract(request: CurrentAdvisorRequest): Promise<number | null> {
    const user = request.user;
    if (user?.role === 'ADMINISTRADOR') {
      return null;
    }
    if (user?.role !== 'ASESOR') {
      throw new ForbiddenException('An advisor or administrator role is required');
    }
    if (!Number.isInteger(user.idAsesor) || !user.idAsesor || user.idAsesor <= 0) {
      throw new UnauthorizedException('Authenticated advisor is required.');
    }
    return user.idAsesor;
  }
}
