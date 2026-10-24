import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../domain/user-role.enum.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'Unauthorized: invalid or missing session',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        zoneId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized: user does not exist');
    }

    request.user = {
      ...request.user,
      role: user.role,
      zoneId: user.zoneId,
    };
    const hasRole =
      requiredRoles.includes(user.role) ||
      (user.role === UserRole.ADMIN &&
        requiredRoles.includes(UserRole.ADMINISTRADOR)) ||
      (user.role === UserRole.ADMINISTRADOR &&
        requiredRoles.includes(UserRole.ADMIN));

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
