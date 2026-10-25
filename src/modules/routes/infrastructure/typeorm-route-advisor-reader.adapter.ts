import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteAdvisorReaderPort } from '../application/ports/route-advisor-reader.port.js';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';
import { AdvisorOrmEntity } from '../../advisors/infrastructure/advisor.orm-entity.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * RouteAdvisorReaderPort implementation. An advisor is a user with the
 * ASESOR role; the optional `advisors` profile only matters when it marks
 * the account inactive (users without a profile are treated as active).
 */
@Injectable()
export class TypeOrmRouteAdvisorReaderAdapter implements RouteAdvisorReaderPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(AdvisorOrmEntity)
    private readonly advisorRepository: Repository<AdvisorOrmEntity>,
  ) {}

  async isActiveAdvisor(advisorId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: advisorId },
      select: { id: true, role: true },
    });
    if (!user || user.role !== UserRole.ASESOR) {
      return false;
    }

    const profile = await this.advisorRepository.findOne({
      where: { userId: advisorId },
      select: { userId: true, isActive: true },
    });
    return !profile || profile.isActive;
  }
}
