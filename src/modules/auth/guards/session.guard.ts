import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthTokenService } from '../application/auth-token.service.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: AuthTokenService,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;
    const match =
      typeof authorization === 'string'
        ? /^Bearer\s+(.+)$/i.exec(authorization)
        : null;

    if (!match) {
      throw new UnauthorizedException('Missing bearer access token');
    }

    const claims = await this.tokenService.authenticateAccess(match[1]);
    const user = await this.userRepository.findOne({
      where: { id: claims.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        zoneId: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    request.session = { id: claims.sid };
    request.user = user;

    return true;
  }
}
