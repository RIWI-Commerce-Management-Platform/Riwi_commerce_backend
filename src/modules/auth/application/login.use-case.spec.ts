import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { LoginUseCase } from './login.use-case.js';
import { InvalidCredentialsError } from '../domain/errors/invalid-credentials.error.js';

describe('LoginUseCase', () => {
  const createMockAuthService = (signInEmailFn: any) =>
    ({
      api: {
        signInEmail: signInEmailFn,
      },
    }) as unknown as AuthService;

  it('should sign in successfully and return data and cookie headers', async () => {
    const mockResponse = {
      ok: true,
      headers: {
        getSetCookie: () => ['session=123'],
      },
      json: vi.fn().mockResolvedValue({ user: { id: 'u1' } }),
    } as unknown as Response;

    const signInEmail = vi.fn().mockResolvedValue(mockResponse);
    const authService = createMockAuthService(signInEmail);

    const useCase = new LoginUseCase(authService);
    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'Password123!',
      rememberMe: true,
      headers: {},
    });

    expect(signInEmail).toHaveBeenCalled();
    expect(result.data).toEqual({ user: { id: 'u1' } });
    expect(result.setCookieHeaders).toEqual(['session=123']);
  });

  it('should throw InvalidCredentialsError when response.ok is false', async () => {
    const mockResponse = {
      ok: false,
      headers: {
        getSetCookie: () => [],
      },
      json: vi.fn().mockResolvedValue({ message: 'Invalid email or password' }),
    } as unknown as Response;

    const signInEmail = vi.fn().mockResolvedValue(mockResponse);
    const authService = createMockAuthService(signInEmail);

    const useCase = new LoginUseCase(authService);

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'wrong',
        rememberMe: false,
        headers: {},
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw InvalidCredentialsError when signInEmail throws an unexpected exception', async () => {
    const signInEmail = vi.fn().mockRejectedValue(new Error('Network error'));
    const authService = createMockAuthService(signInEmail);

    const useCase = new LoginUseCase(authService);

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'wrong',
        rememberMe: false,
        headers: {},
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});

describe('LoginUseCase error details', () => {
  const input = {
    email: 'a@b.co',
    password: 'x',
    rememberMe: false,
    headers: {},
  };
  const run = (signInEmail: ReturnType<typeof vi.fn>) =>
    new LoginUseCase({
      api: { signInEmail },
    } as unknown as AuthService).execute(input);
  const failedResponse = (json: ReturnType<typeof vi.fn>) =>
    ({
      ok: false,
      headers: { getSetCookie: () => [] },
      json,
    }) as unknown as Response;

  it('still fails when the error body is not JSON', async () => {
    const signInEmail = vi
      .fn()
      .mockResolvedValue(
        failedResponse(vi.fn().mockRejectedValue(new SyntaxError('bad json'))),
      );

    await expect(run(signInEmail)).rejects.toThrow(InvalidCredentialsError);
  });

  it('uses the status text when the body has no message', async () => {
    const signInEmail = vi
      .fn()
      .mockResolvedValue(
        failedResponse(
          vi.fn().mockResolvedValue({ statusText: 'UNAUTHORIZED' }),
        ),
      );

    await expect(run(signInEmail)).rejects.toThrow('UNAUTHORIZED');
  });

  it('uses the Better Auth error body message when the call throws', async () => {
    const signInEmail = vi
      .fn()
      .mockRejectedValue({ body: { message: 'Blocked by hook' } });

    await expect(run(signInEmail)).rejects.toThrow('Blocked by hook');
  });

  it('wraps a thrown value that is not an Error', async () => {
    const signInEmail = vi.fn().mockRejectedValue('boom');

    await expect(run(signInEmail)).rejects.toThrow(InvalidCredentialsError);
  });
});
