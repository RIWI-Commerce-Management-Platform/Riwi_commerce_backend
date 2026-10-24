import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { LoginUseCase } from '../application/login.use-case.js';
import { RegisterUseCase } from '../application/register.use-case.js';
import { LogoutUseCase } from '../application/logout.use-case.js';
import { GetCurrentUserUseCase } from '../application/get-current-user.use-case.js';
import { AssignUserRoleUseCase } from '../application/assign-user-role.use-case.js';
import { InvalidCredentialsError } from '../domain/errors/invalid-credentials.error.js';
import { RegistrationFailedError } from '../domain/errors/registration-failed.error.js';
import { InvalidRoleError } from '../domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';
import { UserRole } from '../domain/user-role.enum.js';

describe('AuthController', () => {
  const setup = () => {
    const loginUseCase = { execute: vi.fn() } as unknown as LoginUseCase;
    const registerUseCase = { execute: vi.fn() } as unknown as RegisterUseCase;
    const logoutUseCase = { execute: vi.fn() } as unknown as LogoutUseCase;
    const getCurrentUserUseCase = {
      execute: vi.fn(),
    } as unknown as GetCurrentUserUseCase;
    const assignUserRoleUseCase = {
      execute: vi.fn(),
    } as unknown as AssignUserRoleUseCase;

    const controller = new AuthController(
      loginUseCase,
      registerUseCase,
      logoutUseCase,
      getCurrentUserUseCase,
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
      loginUseCase,
      registerUseCase,
      logoutUseCase,
      getCurrentUserUseCase,
      assignUserRoleUseCase,
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

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockResolvedValue({
        id: 1,
        role: UserRole.ADMIN,
        zoneId: null,
      });

      const result = await controller.assignRole(1, {
        role: UserRole.ADMIN,
      });

      expect(result).toEqual({
        id: 1,
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
        controller.assignRole(1, { role: 'INVALID' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on ZoneRequiredError', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockRejectedValue(
        new ZoneRequiredError(),
      );

      await expect(
        controller.assignRole(1, { role: UserRole.DIRECTOR_REGIONAL }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on UnexpectedZoneError', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockRejectedValue(
        new UnexpectedZoneError(),
      );

      await expect(
        controller.assignRole(1, { role: UserRole.ASESOR, zoneId: 3 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException on ZoneNotFoundError', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      (assignUserRoleUseCase.execute as any).mockRejectedValue(
        new ZoneNotFoundError(),
      );

      await expect(
        controller.assignRole(1, {
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
        controller.assignRole(99, { role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rethrow unexpected errors', async () => {
      const {
        controller,
        loginUseCase,
        registerUseCase,
        getCurrentUserUseCase,
        assignUserRoleUseCase,
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

      (assignUserRoleUseCase.execute as any).mockRejectedValueOnce(err);
      await expect(
        controller.assignRole(1, { role: UserRole.ADMIN }),
      ).rejects.toThrow(err);
    });
  });
});
