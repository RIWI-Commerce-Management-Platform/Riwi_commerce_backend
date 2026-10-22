import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { LogoutUseCase } from './logout.use-case.js';

describe('LogoutUseCase', () => {
  it('should sign out successfully and return setCookieHeaders', async () => {
    const mockResponse = {
      headers: {
        getSetCookie: () => ['session=; Max-Age=0'],
      },
    } as unknown as Response;

    const signOut = vi.fn().mockResolvedValue(mockResponse);
    const authService = {
      api: { signOut },
    } as unknown as AuthService;

    const useCase = new LogoutUseCase(authService);
    const result = await useCase.execute({});

    expect(signOut).toHaveBeenCalled();
    expect(result.setCookieHeaders).toEqual(['session=; Max-Age=0']);
  });
});
