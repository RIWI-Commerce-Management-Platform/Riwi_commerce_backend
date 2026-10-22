import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { fromNodeHeaders } from 'better-auth/node';
import { Repository } from 'typeorm';
import { AuthTokenService } from '../application/auth-token.service.js';
import { auth } from '../auth.js';
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

    const claims = match
      ? await this.tokenService.authenticateAccess(match[1])
      : null;
    const betterAuthSession = claims
      ? null
      : await auth.api.getSession({
          headers: fromNodeHeaders(request.headers ?? {}),
        });
    if (!claims && (!betterAuthSession?.session || !betterAuthSession.user)) {
      throw new UnauthorizedException(
        'Missing or invalid Bearer token or Better Auth session',
      );
    }

    const userId = claims?.sub ?? betterAuthSession?.user.id;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is missing');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
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

    request.session = {
      id: claims?.sid ?? betterAuthSession?.session.id,
      authProvider: claims ? 'jwt' : 'better-auth',
    };
    request.user = user;

    return true;
  }
}
