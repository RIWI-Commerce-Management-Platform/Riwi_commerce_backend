import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Repository } from 'typeorm';
import type { AuthTokenService } from '../application/auth-token.service.js';
import type { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { SessionGuard } from './session.guard.js';
import type { BetterAuthGateway } from '../infrastructure/adapters/better-auth.gateway.js';

describe('SessionGuard', () => {
  const request = { headers: {}, path: '/private' };
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
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

  afterEach(() => {
    betterAuth.getSession.mockReset();
    tokenService.authenticateAccess.mockReset();
    userRepository.findOne.mockReset();
    advisorRepository.findOne.mockReset();
    advisorRepository.exists.mockReset();
    clientRepository.findOne.mockReset();
    clientRepository.exists.mockReset();
  });

  it('allows access without checking the session when the route is public', async () => {
    const guard = createGuard(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(betterAuth.getSession).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when there is no session', async () => {
    betterAuth.getSession.mockResolvedValue(null);
    const guard = createGuard(false);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the session and user to the request and allows access', async () => {
    const session = { id: 'session-1' };
    const authUser = { id: 'user-1', email: 'user@example.com' };
    const user = {
      id: 'user-1',
      name: 'Example User',
      email: 'user@example.com',
      role: 'ASESOR',
      zoneId: null,
    };
    betterAuth.getSession.mockResolvedValue({
      session,
      user: authUser,
    } as any);
    userRepository.findOne.mockResolvedValue(user as UserOrmEntity);
    advisorRepository.findOne.mockResolvedValue({
      idAsesor: 8,
      correo: authUser.email,
    });
    const guard = createGuard(false);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect((request as any).session).toEqual({
      id: session.id,
      authProvider: 'better-auth',
    });
    expect((request as any).user).toMatchObject({
      ...user,
      idAsesor: 8,
      idCliente: null,
    });
  });

  it('allows Better Auth endpoints to handle their own session lifecycle', async () => {
    request.path = '/api/auth/sign-in/email';
    const guard = createGuard(false);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(betterAuth.getSession).not.toHaveBeenCalled();
    request.path = '/private';
  });
});
