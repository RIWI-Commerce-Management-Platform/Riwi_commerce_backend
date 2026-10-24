import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { InvalidRoleError } from '../../auth/domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../../auth/domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../../auth/domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../../auth/domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../../auth/domain/errors/user-not-found.error.js';

export interface AssignUserRoleInput {
  userId: number;
  role: UserRole;
  zoneId?: number;
}

export interface AssignUserRoleResult {
  id: number;
  role: UserRole;
  zoneId: number | null;
}

@Injectable()
export class AssignUserRoleUseCase {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(ZoneOrmEntity)
    private readonly zoneRepository: Repository<ZoneOrmEntity>,
  ) {}

  async execute(input: AssignUserRoleInput): Promise<AssignUserRoleResult> {
    if (!Object.values(UserRole).includes(input.role)) {
      throw new InvalidRoleError();
    }

    let zoneId: number | null = null;
    if (input.role === UserRole.DIRECTOR_REGIONAL) {
      if (!input.zoneId || !Number.isInteger(input.zoneId)) {
        throw new ZoneRequiredError();
      }

      const zone = await this.zoneRepository.findOneBy({ id: input.zoneId });
      if (!zone) {
        throw new ZoneNotFoundError();
      }
      zoneId = zone.id!;
    } else if (input.zoneId) {
      throw new UnexpectedZoneError();
    }

    const user = await this.userRepository.findOneBy({ id: input.userId });
    if (!user) {
      throw new UserNotFoundError();
    }

    user.role = input.role;
    user.zoneId = zoneId;
    await this.userRepository.save(user);

    return { id: user.id, role: user.role, zoneId: user.zoneId };
  }
}
