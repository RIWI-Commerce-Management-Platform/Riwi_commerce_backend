import { describe, expect, it, vi } from 'vitest';
import { BetterAuthGateway } from './better-auth.gateway.js';
import { auth } from './better-auth.adapter.js';

vi.mock('./better-auth.adapter.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe('BetterAuthGateway', () => {
  const gateway = new BetterAuthGateway();

  it('calls auth.api.getSession with node headers', async () => {
    (auth.api.getSession as any).mockResolvedValue({ session: { id: 's1' } });
    const result = await gateway.getSession({ cookie: 'a=1' });
    expect(auth.api.getSession).toHaveBeenCalled();
    expect(result).toEqual({ session: { id: 's1' } });
  });

  it('calls auth.api.requestPasswordReset with email and redirectTo', async () => {
    (auth.api.requestPasswordReset as any).mockResolvedValue({ status: true });
    const result = await gateway.requestPasswordReset(
      'u@riwi.com',
      'http://redir',
    );
    expect(auth.api.requestPasswordReset).toHaveBeenCalledWith({
      body: { email: 'u@riwi.com', redirectTo: 'http://redir' },
    });
    expect(result).toEqual({ status: true });
  });

  it('calls auth.api.resetPassword with token and newPassword', async () => {
    (auth.api.resetPassword as any).mockResolvedValue({ status: true });
    const result = await gateway.resetPassword('token-123', 'NewPass123!');
    expect(auth.api.resetPassword).toHaveBeenCalledWith({
      body: { token: 'token-123', newPassword: 'NewPass123!' },
    });
    expect(result).toEqual({ status: true });
  });

  it('calls auth.api.signOut with headers and asResponse true', async () => {
    (auth.api.signOut as any).mockResolvedValue({ ok: true });
    const result = await gateway.signOut({ cookie: 'b=2' });
    expect(auth.api.signOut).toHaveBeenCalledWith({
      headers: expect.anything(),
      asResponse: true,
    });
    expect(result).toEqual({ ok: true });
  });
});
