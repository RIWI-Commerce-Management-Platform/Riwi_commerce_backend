import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from '../application/auth.service.js';
import { BetterAuthGateway } from '../infrastructure/adapters/better-auth.gateway.js';
import { VerificationOrmEntity } from '../infrastructure/verification.orm-entity.js';
import { AssignUserRoleUseCase } from '../application/assign-user-role.use-case.js';
import { InvalidRoleError } from '../domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';
import { UserRole } from '../domain/user-role.enum.js';

describe('AuthController', () => {
  const setup = () => {
    const authService = {
      login: vi.fn(),
      register: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
      revokeAllSessions: vi.fn(),
    } as unknown as AuthService;

    const betterAuth = {
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      signOut: vi.fn(),
    } as unknown as BetterAuthGateway;

    const verificationRepository = {
      findOneBy: vi.fn(),
    } as unknown as Repository<VerificationOrmEntity>;

    const assignUserRoleUseCase = {
      execute: vi.fn(),
    } as unknown as AssignUserRoleUseCase;

    const controller = new AuthController(
      authService,
      betterAuth,
      verificationRepository,
      assignUserRoleUseCase,
    );

    const mockRes = {
      setHeader: vi.fn(),
    } as any;

    const mockReq = {
      headers: { host: 'localhost' },
    } as any;

    return {
      controller,
      authService,
      betterAuth,
      verificationRepository,
      assignUserRoleUseCase,
      mockRes,
      mockReq,
    };
  };

  describe('login', () => {
    it('should login and return tokens and user', async () => {
      const { controller, authService } = setup();
      const mockResult = {
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
        user: { id: 'u1', email: 'test@riwi.com' },
      };
      (authService.login as any).mockResolvedValue(mockResult);

      const result = await controller.login({
        email: 'test@riwi.com',
        password: 'Password123!',
      });

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@riwi.com',
        password: 'Password123!',
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const { controller, authService } = setup();
      (authService.login as any).mockRejectedValue(
        new UnauthorizedException('Incorrect email or password'),
      );

      await expect(
        controller.login({ email: 'test@riwi.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const { controller, authService } = setup();
      const mockResult = {
        user: {
          id: 'u1',
          name: 'Advisor',
          email: 'adv@riwi.com',
          role: UserRole.ASESOR,
        },
      };
      (authService.register as any).mockResolvedValue(mockResult);

      const result = await controller.register({
        name: 'Advisor',
        email: 'adv@riwi.com',
        password: 'Password123!',
      });

      expect(authService.register).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should rethrow errors from authService.register', async () => {
      const { controller, authService } = setup();
      (authService.register as any).mockRejectedValue(
        new BadRequestException('Invalid name, email, or password'),
      );

      await expect(
        controller.register({
          name: '',
          email: 'invalid',
          password: '123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should throw BadRequestException if email is missing or not a string', async () => {
      const { controller } = setup();
      await expect(
        controller.forgotPassword({ email: '' as any }),
      ).rejects.toThrow(BadRequestException);
      await expect(controller.forgotPassword(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should request password reset and return success message', async () => {
      const { controller, betterAuth } = setup();
      (betterAuth.requestPasswordReset as any).mockResolvedValue({
        message: 'Reset link sent',
      });

      const result = await controller.forgotPassword({
        email: 'user@riwi.com',
      });

      expect(betterAuth.requestPasswordReset).toHaveBeenCalledWith(
        'user@riwi.com',
        expect.stringContaining('/reset-password'),
      );
      expect(result).toEqual({ status: true, message: 'Reset link sent' });
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token or password is invalid', async () => {
      const { controller } = setup();
      await expect(
        controller.resetPassword({ token: '', newPassword: 'short' }),
      ).rejects.toThrow(BadRequestException);
      await expect(controller.resetPassword(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reset password and revoke sessions if verification exists', async () => {
      const { controller, betterAuth, verificationRepository, authService } =
        setup();
      (verificationRepository.findOneBy as any).mockResolvedValue({
        identifier: 'reset-password:valid-token',
        value: 'user-id-123',
      });
      (betterAuth.resetPassword as any).mockResolvedValue({ status: true });

      const result = await controller.resetPassword({
        token: 'valid-token',
        newPassword: 'NewPassword123!',
      });

      expect(verificationRepository.findOneBy).toHaveBeenCalledWith({
        identifier: 'reset-password:valid-token',
      });
      expect(betterAuth.resetPassword).toHaveBeenCalledWith(
        'valid-token',
        'NewPassword123!',
      );
      expect(authService.revokeAllSessions).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual({ status: true });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const { controller, authService } = setup();
      const mockTokens = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      };
      (authService.refresh as any).mockResolvedValue(mockTokens);

      const result = await controller.refresh({ refreshToken: 'old-refresh' });

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh');
      expect(result).toEqual(mockTokens);
    });
  });

  describe('logout', () => {
    it('should logout via betterAuth when session authProvider is better-auth', async () => {
      const { controller, betterAuth, mockReq, mockRes } = setup();
      const mockResponse = {
        headers: {
          getSetCookie: () => ['clear-cookie=1'],
        },
      } as any;
      (betterAuth.signOut as any).mockResolvedValue(mockResponse);

      const result = await controller.logout(
        'u1',
        { id: 's1', authProvider: 'better-auth' },
        mockReq,
        mockRes,
      );

      expect(betterAuth.signOut).toHaveBeenCalledWith(mockReq.headers);
      expect(mockRes.setHeader).toHaveBeenCalledWith('set-cookie', [
        'clear-cookie=1',
      ]);
      expect(result).toEqual({
        success: true,
        message: 'Session ended successfully',
      });
    });

    it('should logout via authService when session authProvider is not better-auth', async () => {
      const { controller, authService, mockReq, mockRes } = setup();
      const result = await controller.logout(
        'u1',
        { id: 's1', authProvider: 'jwt' },
        mockReq,
        mockRes,
      );

      expect(authService.logout).toHaveBeenCalledWith('u1', 's1');
      expect(result).toEqual({
        success: true,
        message: 'Session ended successfully',
      });
    });
  });

  describe('getMe', () => {
    it('should return user and session', () => {
      const { controller } = setup();
      const user = { id: 'u1', name: 'Test User' } as any;
      const session = { id: 's1' };

      const result = controller.getMe(user, session);

      expect(result).toEqual({ user, session });
    });
  });

  describe('protectedEndpoint', () => {
    it('should return user info with access granted', () => {
      const { controller } = setup();
      const result = controller.protectedEndpoint({ id: 'u1' } as any);
      expect(result).toEqual({
        message: 'Access granted',
        user: { id: 'u1' },
      });
    });
  });

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockResolvedValue({
        id: 'u1',
        role: UserRole.ADMIN,
        zoneId: null,
      });

      const result = await controller.assignRole('u1', {
        role: UserRole.ADMIN,
      });

      expect(result).toEqual({
        id: 'u1',
        role: UserRole.ADMIN,
        zoneId: null,
      });
    });

    it('should throw BadRequestException on InvalidRoleError', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockRejectedValue(
        new InvalidRoleError(),
      );

      await expect(
        controller.assignRole('u1', { role: 'INVALID' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on ZoneRequiredError', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockRejectedValue(
        new ZoneRequiredError(),
      );

      await expect(
        controller.assignRole('u1', { role: UserRole.DIRECTOR_REGIONAL }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on UnexpectedZoneError', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockRejectedValue(
        new UnexpectedZoneError(),
      );

      await expect(
        controller.assignRole('u1', { role: UserRole.ASESOR, zoneId: 3 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException on ZoneNotFoundError', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockRejectedValue(
        new ZoneNotFoundError(),
      );

      await expect(
        controller.assignRole('u1', {
          role: UserRole.DIRECTOR_REGIONAL,
          zoneId: 99,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException on UserNotFoundError', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockRejectedValue(
        new UserNotFoundError(),
      );

      await expect(
        controller.assignRole('u99', { role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rethrow unexpected errors', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      const err = new Error('Database down');

      (assignUserRoleUseCase.execute as any).mockRejectedValueOnce(err);
      await expect(
        controller.assignRole('u1', { role: UserRole.ADMIN }),
      ).rejects.toThrow(err);
    });
  });
});
