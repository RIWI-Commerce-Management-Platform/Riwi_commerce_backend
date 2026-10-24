import { describe, expect, it, vi } from 'vitest';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case.js';
import { ResetPasswordUseCase } from './reset-password.use-case.js';
import { StartMicrosoftLoginUseCase } from './start-microsoft-login.use-case.js';
import { InvalidResetTokenError } from '../domain/errors/invalid-reset-token.error.js';
import { SocialLoginUnavailableError } from '../domain/errors/social-login-unavailable.error.js';

const authServiceWith = (api: Record<string, unknown>) => ({ api }) as any;

describe('RequestPasswordResetUseCase', () => {
  it('asks Better Auth for the reset email', async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue({ status: true });
    const useCase = new RequestPasswordResetUseCase(
      authServiceWith({ requestPasswordReset }),
    );

    await useCase.execute({ email: 'a@b.co', redirectTo: 'http://f/reset' });

    expect(requestPasswordReset).toHaveBeenCalledWith({
      body: { email: 'a@b.co', redirectTo: 'http://f/reset' },
    });
  });

  it('never reveals a failure to the caller', async () => {
    const useCase = new RequestPasswordResetUseCase(
      authServiceWith({
        requestPasswordReset: vi.fn().mockRejectedValue(new Error('smtp')),
      }),
    );

    await expect(
      useCase.execute({ email: 'a@b.co', redirectTo: 'http://f/reset' }),
    ).resolves.toBeUndefined();
  });
});

describe('ResetPasswordUseCase', () => {
  it('resets the password with the token', async () => {
    const resetPassword = vi.fn().mockResolvedValue({ status: true });
    const useCase = new ResetPasswordUseCase(
      authServiceWith({ resetPassword }),
    );

    await useCase.execute({ token: 't', newPassword: 'Password123!' });

    expect(resetPassword).toHaveBeenCalledWith({
      body: { token: 't', newPassword: 'Password123!' },
    });
  });

  it('turns a Better Auth rejection into InvalidResetTokenError', async () => {
    const useCase = new ResetPasswordUseCase(
      authServiceWith({
        resetPassword: vi
          .fn()
          .mockRejectedValue({ body: { message: 'Invalid token' } }),
      }),
    );

    await expect(
      useCase.execute({ token: 'bad', newPassword: 'Password123!' }),
    ).rejects.toThrow(InvalidResetTokenError);
  });
});

describe('StartMicrosoftLoginUseCase', () => {
  const response = (ok: boolean, body: unknown) =>
    ({
      ok,
      json: vi.fn().mockResolvedValue(body),
      headers: { getSetCookie: () => ['state=abc'] },
    }) as unknown as Response;

  it('returns the authorization url and the state cookie', async () => {
    const signInSocial = vi
      .fn()
      .mockResolvedValue(
        response(true, { url: 'https://ms/login', redirect: true }),
      );
    const useCase = new StartMicrosoftLoginUseCase(
      authServiceWith({ signInSocial }),
    );

    const result = await useCase.execute({
      callbackURL: 'http://f',
      headers: {},
    });

    expect(result).toEqual({
      url: 'https://ms/login',
      setCookieHeaders: ['state=abc'],
    });
    expect(signInSocial.mock.calls[0][0].body.provider).toBe('microsoft');
  });

  it('fails when the provider is not configured', async () => {
    const useCase = new StartMicrosoftLoginUseCase(
      authServiceWith({
        signInSocial: vi
          .fn()
          .mockRejectedValue({ body: { message: 'Provider not found' } }),
      }),
    );

    await expect(
      useCase.execute({ callbackURL: 'http://f', headers: {} }),
    ).rejects.toThrow(SocialLoginUnavailableError);
  });

  it('fails when Better Auth answers without a url', async () => {
    const useCase = new StartMicrosoftLoginUseCase(
      authServiceWith({
        signInSocial: vi.fn().mockResolvedValue(response(false, {})),
      }),
    );

    await expect(
      useCase.execute({ callbackURL: 'http://f', headers: {} }),
    ).rejects.toThrow(SocialLoginUnavailableError);
  });
});
