import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { SessionCurrentActorProvider } from './session-current-actor.provider.js';
import { scopeForActor } from '../domain/current-actor.provider.js';
import { UserRole } from '../../../modules/auth/domain/user-role.enum.js';

describe('SessionCurrentActorProvider', () => {
  const buildProvider = (user: unknown) => {
    const repository = { findOne: vi.fn().mockResolvedValue(user) };
    return {
      provider: new SessionCurrentActorProvider(repository as any),
      repository,
    };
  };

  it('returns the role and zone read from the database', async () => {
    const { provider, repository } = buildProvider({
      id: 7,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 3,
    });

    await expect(
      provider.extract({ user: { id: 7, role: 'ASESOR' } }),
    ).resolves.toEqual({
      id: 7,
      role: UserRole.DIRECTOR_REGIONAL,
      zoneId: 3,
    });
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 } }),
    );
  });

  it('rejects a request without a numeric user id', async () => {
    const { provider } = buildProvider(null);
    await expect(provider.extract({ user: { id: '7' } })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a user that no longer exists', async () => {
    const { provider } = buildProvider(null);
    await expect(provider.extract({ user: { id: 7 } })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('scopeForActor', () => {
  it('limits an advisor to their own records', () => {
    expect(
      scopeForActor({ id: 4, role: UserRole.ASESOR, zoneId: null }),
    ).toEqual({
      advisorId: 4,
    });
  });

  it('limits a director to their zone', () => {
    expect(
      scopeForActor({ id: 2, role: UserRole.DIRECTOR_REGIONAL, zoneId: 5 }),
    ).toEqual({ zoneId: 5 });
  });

  it('gives a director without a zone an impossible zone', () => {
    expect(
      scopeForActor({ id: 2, role: UserRole.DIRECTOR_REGIONAL, zoneId: null }),
    ).toEqual({ zoneId: -1 });
  });

  it('does not restrict an admin or a missing actor', () => {
    expect(
      scopeForActor({ id: 1, role: UserRole.ADMIN, zoneId: null }),
    ).toEqual({});
    expect(scopeForActor(undefined)).toEqual({});
  });
});
