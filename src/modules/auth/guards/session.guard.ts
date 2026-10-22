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
import { BetterAuthGateway } from '../infrastructure/adapters/better-auth.gateway.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { AdvisorOrmEntity } from '../../advisors/infrastructure/advisor.orm-entity.js';
import { ClientOrmEntity } from '../../clients/infrastructure/client.orm-entity.js';
import { UserRole } from '../domain/user-role.enum.js';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: AuthTokenService,
    private readonly betterAuth: BetterAuthGateway,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(AdvisorOrmEntity)
    private readonly advisorRepository: Repository<AdvisorOrmEntity>,
    @InjectRepository(ClientOrmEntity)
    private readonly clientRepository: Repository<ClientOrmEntity>,
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
    if (
      typeof request.path === 'string' &&
      (request.path === '/api/auth' || request.path.startsWith('/api/auth/'))
    ) {
      return true;
    }
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
      : await this.betterAuth.getSession(request.headers ?? {});
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

    let idAsesor: number | null = null;
    let idCliente: number | null = null;
    if (user.role === UserRole.ASESOR) {
      const advisor = await this.advisorRepository.findOne({
        where: { idUsuario: user.id },
        select: { idAsesor: true, correo: true },
      });
      if (!advisor || advisor.correo.toLowerCase() !== user.email.toLowerCase()) {
        throw new UnauthorizedException(
          'The authenticated advisor is not linked to a matching advisor record',
        );
      }
      idAsesor = advisor.idAsesor;
    } else if (user.role === UserRole.CLIENTE) {
      const client = await this.clientRepository.findOne({
        where: { idUsuario: user.id },
        select: { id: true, email: true },
      });
      if (!client || client.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new UnauthorizedException(
          'The authenticated client is not linked to a matching client record',
        );
      }
      idCliente = client.id;
    } else if (user.role === UserRole.ADMINISTRADOR) {
      const [advisor, client] = await Promise.all([
        this.advisorRepository.exists({ where: { idUsuario: user.id } }),
        this.clientRepository.exists({ where: { idUsuario: user.id } }),
      ]);
      if (advisor || client) {
        throw new UnauthorizedException(
          'Administrator accounts cannot be linked to advisor or client records',
        );
      }
    }

    request.session = {
      id: claims?.sid ?? betterAuthSession?.session.id,
      authProvider: claims ? 'jwt' : 'better-auth',
    };
    request.user = { ...user, idAsesor, idCliente };

    return true;
  }
}
