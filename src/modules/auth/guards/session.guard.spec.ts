import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Repository } from 'typeorm';
import type { AuthTokenService } from '../application/auth-token.service.js';
import type { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { SessionGuard } from './session.guard.js';
import type { BetterAuthGateway } from '../infrastructure/adapters/better-auth.gateway.js';
import { UserRole } from '../domain/user-role.enum.js';

describe('SessionGuard', () => {
  let request: any;
  let context: ExecutionContext;

  const tokenService = {
    authenticateAccess: vi.fn(),
  };
  const userRepository = {
    findOne: vi.fn(),
  };
  const advisorRepository = {
    findOne: vi.fn(),
    exists: vi.fn(),
  };
  const clientRepository = {
    findOne: vi.fn(),
    exists: vi.fn(),
  };
  const betterAuth = { getSession: vi.fn() };

  beforeEach(() => {
    request = { headers: {}, path: '/private' };
    context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    betterAuth.getSession.mockReset();
    tokenService.authenticateAccess.mockReset();
    userRepository.findOne.mockReset();
    advisorRepository.findOne.mockReset();
    advisorRepository.exists.mockReset();
    clientRepository.findOne.mockReset();
    clientRepository.exists.mockReset();
  });

  function createGuard(isPublic: boolean) {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(isPublic),
    } as unknown as Reflector;
    return new SessionGuard(
      reflector,
      tokenService as unknown as AuthTokenService,
      betterAuth as unknown as BetterAuthGateway,
      userRepository as unknown as Repository<UserOrmEntity>,
      advisorRepository as unknown as Repository<never>,
      clientRepository as unknown as Repository<never>,
    );
  }

  it('allows access without checking the session when the route is public', async () => {
    const guard = createGuard(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(betterAuth.getSession).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when there is no session or token', async () => {
    betterAuth.getSession.mockResolvedValue(null);
    const guard = createGuard(false);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('authenticates via Bearer token and attaches user and session', async () => {
    request.headers.authorization = 'Bearer valid-jwt-token';
    tokenService.authenticateAccess.mockResolvedValue({
      sub: 'jwt-user-1',
      sid: 'jwt-session-1',
    });
    userRepository.findOne.mockResolvedValue({
      id: 'jwt-user-1',
      email: 'admin@riwi.com',
      role: UserRole.ADMINISTRADOR,
    } as UserOrmEntity);
    advisorRepository.exists.mockResolvedValue(false);
    clientRepository.exists.mockResolvedValue(false);

    const guard = createGuard(false);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.session).toEqual({
      id: 'jwt-session-1',
      authProvider: 'jwt',
    });
    expect(request.user.role).toBe(UserRole.ADMINISTRADOR);
  });

  it('throws UnauthorizedException when authenticated user no longer exists in DB', async () => {
    request.headers.authorization = 'Bearer token';
    tokenService.authenticateAccess.mockResolvedValue({
      sub: 'missing-user',
      sid: 's1',
    });
    userRepository.findOne.mockResolvedValue(null);

    const guard = createGuard(false);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Authenticated user no longer exists',
    );
  });

  it('attaches advisor info for ASESOR role or throws if mismatch', async () => {
    const session = { id: 's1' };
    const authUser = { id: 'u1', email: 'adv@riwi.com' };
    betterAuth.getSession.mockResolvedValue({ session, user: authUser } as any);
    userRepository.findOne.mockResolvedValue({
      id: 'u1',
      email: 'adv@riwi.com',
      role: UserRole.ASESOR,
    } as UserOrmEntity);

    advisorRepository.findOne.mockResolvedValue(null);
    const guard = createGuard(false);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'The authenticated advisor is not linked to a matching advisor record',
    );

    advisorRepository.findOne.mockResolvedValue({
      idAsesor: 5,
      correo: 'adv@riwi.com',
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user.idAsesor).toBe(5);
  });

  it('attaches client info for CLIENTE role or throws if mismatch', async () => {
    request.headers.authorization = 'Bearer client-token';
    tokenService.authenticateAccess.mockResolvedValue({
      sub: 'cli-1',
      sid: 's2',
    });
    userRepository.findOne.mockResolvedValue({
      id: 'cli-1',
      email: 'client@riwi.com',
      role: UserRole.CLIENTE,
    } as UserOrmEntity);

    clientRepository.findOne.mockResolvedValue(null);
    const guard = createGuard(false);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'The authenticated client is not linked to a matching client record',
    );

    clientRepository.findOne.mockResolvedValue({
      id: 99,
      email: 'client@riwi.com',
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user.idCliente).toBe(99);
  });

  it('throws if ADMINISTRADOR account is linked to advisor or client', async () => {
    request.headers.authorization = 'Bearer admin-token';
    tokenService.authenticateAccess.mockResolvedValue({
      sub: 'adm-1',
      sid: 's3',
    });
    userRepository.findOne.mockResolvedValue({
      id: 'adm-1',
      email: 'admin@riwi.com',
      role: UserRole.ADMINISTRADOR,
    } as UserOrmEntity);

    advisorRepository.exists.mockResolvedValue(true);
    clientRepository.exists.mockResolvedValue(false);

    const guard = createGuard(false);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Administrator accounts cannot be linked to advisor or client records',
    );
  });

  it('allows Better Auth endpoints to handle their own session lifecycle', async () => {
    request.path = '/api/auth/sign-in/email';
    const guard = createGuard(false);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(betterAuth.getSession).not.toHaveBeenCalled();
  });
});
