import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CurrentActor,
  CurrentActorProvider,
} from '../domain/current-actor.provider.js';
import { AuthenticatedRequest } from '../domain/current-advisor.provider.js';
import { UserOrmEntity } from '../../../modules/auth/infrastructure/user.orm-entity.js';

/**
 * Resolves the actor from the Better Auth session and re-reads the role and
 * zone from the database, like RolesGuard, so a stale session can't widen
 * what the user is allowed to see.
 */
@Injectable()
export class SessionCurrentActorProvider implements CurrentActorProvider {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async extract(request: object): Promise<CurrentActor> {
    const id = (request as AuthenticatedRequest).user?.id;
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedException('An authenticated session is required.');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: { id: true, role: true, zoneId: true },
    });
    if (!user) {
      throw new UnauthorizedException('Unauthorized: user does not exist');
    }

    return { id: user.id, role: user.role, zoneId: user.zoneId ?? null };
  }
}
