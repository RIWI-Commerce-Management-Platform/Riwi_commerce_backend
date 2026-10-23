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
