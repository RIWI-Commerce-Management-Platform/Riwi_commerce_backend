import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../infrastructure/redis.service.js';
import { AuthTokenService } from './auth-token.service.js';

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    const multi = () => {
      const operations: Array<() => void> = [];
      const transaction = {
        set: (key: string, value: string) => {
          operations.push(() => values.set(key, value));
          return transaction;
        },
        exec: async () => {
          operations.forEach((operation) => operation());
          return operations.map(() => [null, 'OK'] as [null, string]);
        },
      };
      return transaction;
    };

    const client = {
      multi,
      get: async (key: string) => values.get(key) ?? null,
      del: async (...keys: string[]) =>
        keys.reduce((deleted, key) => deleted + Number(values.delete(key)), 0),
      eval: async (_script: string, _keyCount: number, ...args: string[]) => {
        const [
          sessionKey,
          oldRefreshKey,
          newRefreshKey,
          expectedSession,
          expectedHash,
          nextHash,
          nextSession,
        ] = args;
        if (
          values.get(sessionKey) !== expectedSession ||
          values.get(oldRefreshKey) !== expectedHash
        ) {
          return 0;
        }
        values.delete(oldRefreshKey);
        values.set(newRefreshKey, nextHash);
        values.set(sessionKey, nextSession);
        return 1;
      },
    };

    const redis = { client } as unknown as RedisService;
    const config = {
      getOrThrow: (key: string) =>
        ({
          'jwt.secret': 'unit-test-secret-at-least-thirty-two-characters',
          'jwt.accessTtlSeconds': 900,
          'jwt.refreshTtlSeconds': 604800,
        })[key],
    } as unknown as ConfigService;

    service = new AuthTokenService(new JwtService(), redis, config);
  });

  it('creates sessions, rotates refresh tokens once, and rejects reuse', async () => {
    const tokens = await service.createSession('user-1');
    const authenticated = await service.authenticateAccess(tokens.accessToken);
    expect(authenticated.sub).toBe('user-1');
    await expect(
      service.authenticateAccess(tokens.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.refresh(tokens.accessToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const rotated = await service.refresh(tokens.refreshToken);
    await expect(service.refresh(tokens.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(await service.authenticateAccess(rotated.accessToken)).toMatchObject(
      {
        sub: 'user-1',
        sid: authenticated.sid,
      },
    );
  });

  it('revokes the session and its tokens on logout', async () => {
    const tokens = await service.createSession('user-1');
    const claims = await service.authenticateAccess(tokens.accessToken);

    await service.revokeSession('user-1', claims.sid);

    await expect(
      service.authenticateAccess(tokens.accessToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.refresh(tokens.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
