import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { LoginUseCase } from '../application/login.use-case.js';
import { RegisterUseCase } from '../application/register.use-case.js';
import { LogoutUseCase } from '../application/logout.use-case.js';
import { GetCurrentUserUseCase } from '../application/get-current-user.use-case.js';
import { InvalidCredentialsError } from '../domain/errors/invalid-credentials.error.js';
import { RegistrationFailedError } from '../domain/errors/registration-failed.error.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';
import { UserRole } from '../domain/user-role.enum.js';
import { InvalidResetTokenError } from '../domain/errors/invalid-reset-token.error.js';
import { SocialLoginUnavailableError } from '../domain/errors/social-login-unavailable.error.js';

describe('AuthController', () => {
  const setup = () => {
    const loginUseCase = { execute: vi.fn() } as unknown as LoginUseCase;
    const registerUseCase = { execute: vi.fn() } as unknown as RegisterUseCase;
    const logoutUseCase = { execute: vi.fn() } as unknown as LogoutUseCase;
    const getCurrentUserUseCase = {
      execute: vi.fn(),
    } as unknown as GetCurrentUserUseCase;

    const requestPasswordResetUseCase = { execute: vi.fn() };
    const resetPasswordUseCase = { execute: vi.fn() };
    const startMicrosoftLoginUseCase = { execute: vi.fn() };

    const controller = new AuthController(
      loginUseCase,
      registerUseCase,
      logoutUseCase,
      getCurrentUserUseCase,
      requestPasswordResetUseCase as any,
      resetPasswordUseCase as any,
      startMicrosoftLoginUseCase as any,
    );

    const mockRes = {
      setHeader: vi.fn(),
    } as any;

    const mockReq = {
      headers: { host: 'localhost' },
    } as any;

    return {
      controller,
      loginUseCase,
      registerUseCase,
      logoutUseCase,
      getCurrentUserUseCase,
      requestPasswordResetUseCase,
      resetPasswordUseCase,
      startMicrosoftLoginUseCase,
      mockRes,
      mockReq,
    };
  };

  describe('login', () => {
    it('should login and set cookie header', async () => {
      const { controller, loginUseCase, mockReq, mockRes } = setup();
      (loginUseCase.execute as any).mockResolvedValue({
        data: { user: { id: 1 } },
        setCookieHeaders: ['cookie=1'],
      });

      const result = await controller.login(
        { email: 'a@b.com', password: '123', rememberMe: true },
        mockReq,
        mockRes,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith('set-cookie', [
        'cookie=1',
      ]);
      expect(result).toEqual({ user: { id: 1 } });
    });

    it('should throw UnauthorizedException on InvalidCredentialsError', async () => {
      const { controller, loginUseCase, mockReq, mockRes } = setup();
      (loginUseCase.execute as any).mockRejectedValue(
        new InvalidCredentialsError('Bad creds'),
      );

      await expect(
        controller.login(
          { email: 'a@b.com', password: 'wrong' },
          mockReq,
          mockRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register and set cookie header', async () => {
      const { controller, registerUseCase, mockReq, mockRes } = setup();
      (registerUseCase.execute as any).mockResolvedValue({
        data: { user: { id: 2 } },
        setCookieHeaders: ['cookie=2'],
      });

      const result = await controller.register(
        { name: 'Test', email: 'a@b.com', password: '123' },
        mockReq,
        mockRes,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith('set-cookie', [
        'cookie=2',
      ]);
      expect(result).toEqual({ user: { id: 2 } });
    });

    it('should throw BadRequestException on RegistrationFailedError', async () => {
      const { controller, registerUseCase, mockReq, mockRes } = setup();
      (registerUseCase.execute as any).mockRejectedValue(
        new RegistrationFailedError('User exists'),
      );

      await expect(
        controller.register(
          { name: 'Test', email: 'a@b.com', password: '123' },
          mockReq,
          mockRes,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should log out successfully', async () => {
      const { controller, logoutUseCase, mockReq, mockRes } = setup();
      (logoutUseCase.execute as any).mockResolvedValue({
        setCookieHeaders: ['clear-cookie'],
      });

      const result = await controller.logout(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('set-cookie', [
        'clear-cookie',
      ]);
      expect(result).toEqual({
        success: true,
        message: 'Session ended successfully',
      });
    });
  });

  describe('getMe', () => {
    it('should return merged user and session', async () => {
      const { controller, getCurrentUserUseCase } = setup();
      (getCurrentUserUseCase.execute as any).mockResolvedValue({
        id: 1,
        role: UserRole.ASESOR,
        zoneId: 2,
      });

      const result = await controller.getMe({ id: 1, name: 'User' }, { id: 1 });

      expect(result).toEqual({
        user: { id: 1, name: 'User', role: UserRole.ASESOR, zoneId: 2 },
        session: { id: 1 },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const { controller, getCurrentUserUseCase } = setup();
      (getCurrentUserUseCase.execute as any).mockRejectedValue(
        new UserNotFoundError(),
      );

      await expect(controller.getMe({ id: 1 }, { id: 1 })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('protectedEndpoint', () => {
    it('should return user info with access granted', () => {
      const { controller } = setup();
      const result = controller.protectedEndpoint({ id: 1 });
      expect(result).toEqual({
        message: 'Access granted',
        user: { id: 1 },
      });
    });
  });

  describe('unexpected errors', () => {
    it('should rethrow unexpected errors', async () => {
      const {
        controller,
        loginUseCase,
        registerUseCase,
        getCurrentUserUseCase,
        mockReq,
        mockRes,
      } = setup();
      const err = new Error('Unexpected error');

      (loginUseCase.execute as any).mockRejectedValueOnce(err);
      await expect(
        controller.login(
          { email: 'a@b.com', password: '123' },
          mockReq,
          mockRes,
        ),
      ).rejects.toThrow(err);

      (registerUseCase.execute as any).mockRejectedValueOnce(err);
      await expect(
        controller.register(
          { name: 'A', email: 'a@b.com', password: '123' },
          mockReq,
          mockRes,
        ),
      ).rejects.toThrow(err);

      (getCurrentUserUseCase.execute as any).mockRejectedValueOnce(err);
      await expect(controller.getMe({ id: 1 }, {})).rejects.toThrow(err);
    });
  });

  describe('forgotPassword', () => {
    it('requests the reset link with the default frontend page', async () => {
      const { controller, requestPasswordResetUseCase } = setup();

      const result = await controller.forgotPassword({
        email: 'ana@example.com',
      });

      expect(requestPasswordResetUseCase.execute).toHaveBeenCalledWith({
        email: 'ana@example.com',
        redirectTo: 'http://localhost:3000/reset-password',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('updates the password', async () => {
      const { controller, resetPasswordUseCase } = setup();

      await expect(
        controller.resetPassword({ token: 't', newPassword: 'Password123!' }),
      ).resolves.toEqual({
        success: true,
        message: 'Password updated successfully',
      });
      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith({
        token: 't',
        newPassword: 'Password123!',
      });
    });

    it('maps an invalid token to 400', async () => {
      const { controller, resetPasswordUseCase } = setup();
      resetPasswordUseCase.execute.mockRejectedValue(
        new InvalidResetTokenError(),
      );

      await expect(
        controller.resetPassword({ token: 'x', newPassword: 'Password123!' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('microsoftLogin', () => {
    it('returns the authorization url and forwards the state cookie', async () => {
      const { controller, startMicrosoftLoginUseCase, mockReq, mockRes } =
        setup();
      startMicrosoftLoginUseCase.execute.mockResolvedValue({
        url: 'https://login.microsoftonline.com/x',
        setCookieHeaders: ['state=1'],
      });

      const result = await controller.microsoftLogin({}, mockReq, mockRes);

      expect(result).toEqual({ url: 'https://login.microsoftonline.com/x' });
      expect(startMicrosoftLoginUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ callbackURL: 'http://localhost:3000' }),
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith('set-cookie', ['state=1']);
    });

    it('maps a missing provider configuration to 400', async () => {
      const { controller, startMicrosoftLoginUseCase, mockReq, mockRes } =
        setup();
      startMicrosoftLoginUseCase.execute.mockRejectedValue(
        new SocialLoginUnavailableError('Microsoft'),
      );

      await expect(
        controller.microsoftLogin({}, mockReq, mockRes),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
