import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionGuard } from './session.guard.js';
import { auth } from '../auth.js';

vi.mock('../auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

describe('SessionGuard', () => {
  const request = { headers: {} };
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  function createGuard(isPublic: boolean) {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(isPublic),
    } as unknown as Reflector;
    return new SessionGuard(reflector);
  }

  afterEach(() => {
    vi.mocked(auth.api.getSession).mockReset();
  });

  it('allows access without checking the session when the route is public', async () => {
    const guard = createGuard(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const guard = createGuard(false);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the session and user to the request and allows access', async () => {
    const session = { id: 'session-1' };
    const user = { id: 'user-1', email: 'user@example.com' };
    vi.mocked(auth.api.getSession).mockResolvedValue({ session, user } as any);
    const guard = createGuard(false);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect((request as any).session).toBe(session);
    expect((request as any).user).toBe(user);
  });
});
