import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { UserRole } from '../domain/user-role.enum.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const request = { user: { id: 'user-1' } };
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  function createGuard(role: UserRole | null, requiredRoles: UserRole[] | null = [UserRole.ADMIN]) {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;
    const userRepository = {
      findOne: vi
        .fn()
        .mockResolvedValue(
          role ? { id: request.user.id, role, zoneId: null } : null,
        ),
    } as unknown as Repository<UserOrmEntity>;

    return new RolesGuard(reflector, userRepository);
  }

  it('allows access when no required roles are specified', async () => {
    const guard = createGuard(null, null);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('returns 401 when no authenticated user is present', async () => {
    request.user = {} as typeof request.user;
    await expect(
      createGuard(UserRole.ADMIN).canActivate(context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    request.user = { id: 'user-1' };
  });

  it('returns 401 when user is not found in database', async () => {
    await expect(
      createGuard(null).canActivate(context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns 403 when the current role is not allowed', async () => {
    await expect(
      createGuard(UserRole.ASESOR).canActivate(context),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a user with the required role', async () => {
    await expect(
      createGuard(UserRole.ADMIN).canActivate(context),
    ).resolves.toBe(true);
    expect(request.user).toMatchObject({ role: UserRole.ADMIN, zoneId: null });
  });
});
