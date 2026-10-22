import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const headers = fromNodeHeaders(request.headers || {});
    const session = await auth.api.getSession({ headers });

    if (!session || !session.session || !session.user) {
      throw new UnauthorizedException(
        'Unauthorized: invalid or missing session',
      );
    }

    request.session = session.session;
    request.user = session.user;

    return true;
  }
}
