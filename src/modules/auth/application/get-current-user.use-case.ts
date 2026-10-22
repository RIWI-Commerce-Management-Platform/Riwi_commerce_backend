import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { UserRole } from '../domain/user-role.enum.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';

export interface CurrentUserRoleInfo {
  id: string;
  role: UserRole;
  zoneId: number | null;
}

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async execute(userId: string): Promise<CurrentUserRoleInfo> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, role: true, zoneId: true },
    });

    if (!user) {
      throw new UserNotFoundError('Unauthorized: user does not exist');
    }

    return user;
  }
}
