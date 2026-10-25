import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { RegisterUseCase } from './register.use-case.js';
import { RegistrationFailedError } from '../domain/errors/registration-failed.error.js';

describe('RegisterUseCase', () => {
  const createMockAuthService = (signUpEmailFn: any) =>
    ({
      api: {
        signUpEmail: signUpEmailFn,
      },
    }) as unknown as AuthService;

  it('should register successfully and return data and cookie headers', async () => {
    const mockResponse = {
      ok: true,
      headers: {
        getSetCookie: () => ['session=abc'],
      },
      json: vi.fn().mockResolvedValue({ user: { id: 'u2' } }),
    } as unknown as Response;

    const signUpEmail = vi.fn().mockResolvedValue(mockResponse);
    const authService = createMockAuthService(signUpEmail);

    const useCase = new RegisterUseCase(authService);
    const result = await useCase.execute({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      headers: {},
    });

    expect(signUpEmail).toHaveBeenCalled();
    expect(result.data).toEqual({ user: { id: 'u2' } });
    expect(result.setCookieHeaders).toEqual(['session=abc']);
  });

  it('should throw RegistrationFailedError when response.ok is false', async () => {
    const mockResponse = {
      ok: false,
      headers: {
        getSetCookie: () => [],
      },
      json: vi.fn().mockResolvedValue({ message: 'User already exists' }),
    } as unknown as Response;

    const signUpEmail = vi.fn().mockResolvedValue(mockResponse);
    const authService = createMockAuthService(signUpEmail);

    const useCase = new RegisterUseCase(authService);

    await expect(
      useCase.execute({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        headers: {},
      }),
    ).rejects.toThrow(RegistrationFailedError);
  });

  it('should throw RegistrationFailedError when signUpEmail throws an exception', async () => {
    const signUpEmail = vi.fn().mockRejectedValue(new Error('Server crash'));
    const authService = createMockAuthService(signUpEmail);

    const useCase = new RegisterUseCase(authService);

    await expect(
      useCase.execute({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        headers: {},
      }),
    ).rejects.toThrow(RegistrationFailedError);
  });
});

describe('RegisterUseCase error details', () => {
  const input = { name: 'Ana', email: 'a@b.co', password: 'x', headers: {} };
  const run = (signUpEmail: ReturnType<typeof vi.fn>) =>
    new RegisterUseCase({
      api: { signUpEmail },
    } as unknown as AuthService).execute(input);
  const failedResponse = (json: ReturnType<typeof vi.fn>) =>
    ({
      ok: false,
      headers: { getSetCookie: () => [] },
      json,
    }) as unknown as Response;

  it('still fails when the error body is not JSON', async () => {
    const signUpEmail = vi
      .fn()
      .mockResolvedValue(
        failedResponse(vi.fn().mockRejectedValue(new SyntaxError('bad json'))),
      );

    await expect(run(signUpEmail)).rejects.toThrow(RegistrationFailedError);
  });

  it('uses the status text when the body has no message', async () => {
    const signUpEmail = vi
      .fn()
      .mockResolvedValue(
        failedResponse(
          vi.fn().mockResolvedValue({ statusText: 'UNAUTHORIZED' }),
        ),
      );

    await expect(run(signUpEmail)).rejects.toThrow('UNAUTHORIZED');
  });

  it('uses the Better Auth error body message when the call throws', async () => {
    const signUpEmail = vi
      .fn()
      .mockRejectedValue({ body: { message: 'Blocked by hook' } });

    await expect(run(signUpEmail)).rejects.toThrow('Blocked by hook');
  });

  it('wraps a thrown value that is not an Error', async () => {
    const signUpEmail = vi.fn().mockRejectedValue('boom');

    await expect(run(signUpEmail)).rejects.toThrow(RegistrationFailedError);
  });
});
