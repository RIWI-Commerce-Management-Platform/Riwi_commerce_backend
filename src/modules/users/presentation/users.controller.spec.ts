import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { User } from '../domain/user.entity.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { InvalidRoleError } from '../../auth/domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../../auth/domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../../auth/domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../../auth/domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../../auth/domain/errors/user-not-found.error.js';

const user = new User({
  id: 4,
  name: 'Laura',
  email: 'laura@example.com',
  emailVerified: false,
  role: UserRole.ASESOR,
  zoneId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const page = {
  data: [user],
  meta: {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

describe('UsersController', () => {
  const setup = () => {
    const listUsersUseCase = { execute: vi.fn().mockResolvedValue(page) };
    const getUserByIdUseCase = { execute: vi.fn().mockResolvedValue(user) };
    const assignUserRoleUseCase = { execute: vi.fn() };
    const controller = new UsersController(
      listUsersUseCase as any,
      getUserByIdUseCase as any,
      assignUserRoleUseCase as any,
    );
    return {
      controller,
      listUsersUseCase,
      getUserByIdUseCase,
      assignUserRoleUseCase,
    };
  };

  const query = (values: object) =>
    ({ parsedPage: 1, parsedLimit: 10, ...values }) as any;

  describe('list', () => {
    it('lists users with the filters', async () => {
      const { controller, listUsersUseCase } = setup();

      const result = await controller.list(
        query({ role: UserRole.ADMIN, zoneId: 2, search: 'ana' }),
      );

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        role: UserRole.ADMIN,
        zoneId: 2,
        search: 'ana',
        page: 1,
        limit: 10,
      });
      expect(result.data[0]).toMatchObject({
        id: 4,
        email: 'laura@example.com',
        role: UserRole.ASESOR,
      });
    });
  });

  describe('listByRole', () => {
    it('lists the users of the role in the path', async () => {
      const { controller, listUsersUseCase } = setup();

      await controller.listByRole(
        UserRole.DIRECTOR_REGIONAL,
        query({ search: 'x' }),
      );

      expect(listUsersUseCase.execute).toHaveBeenCalledWith({
        role: UserRole.DIRECTOR_REGIONAL,
        search: 'x',
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getById', () => {
    it('returns the user', async () => {
      const { controller } = setup();
      await expect(controller.getById(4)).resolves.toMatchObject({ id: 4 });
    });

    it('maps UserNotFoundError to 404', async () => {
      const { controller, getUserByIdUseCase } = setup();
      getUserByIdUseCase.execute.mockRejectedValue(new UserNotFoundError());
      await expect(controller.getById(9)).rejects.toThrow(NotFoundException);
    });

    it('rethrows unexpected errors', async () => {
      const { controller, getUserByIdUseCase } = setup();
      const err = new Error('boom');
      getUserByIdUseCase.execute.mockRejectedValue(err);
      await expect(controller.getById(9)).rejects.toThrow(err);
    });
  });

  describe('assignRole', () => {
    it('assigns the role', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      assignUserRoleUseCase.execute.mockResolvedValue({
        id: 1,
        role: UserRole.ADMIN,
        zoneId: null,
      });

      await expect(
        controller.assignRole(1, { role: UserRole.ADMIN }),
      ).resolves.toEqual({ id: 1, role: UserRole.ADMIN, zoneId: null });
      expect(assignUserRoleUseCase.execute).toHaveBeenCalledWith({
        userId: 1,
        role: UserRole.ADMIN,
        zoneId: undefined,
      });
    });

    it.each([
      [new InvalidRoleError(), BadRequestException],
      [new ZoneRequiredError(), BadRequestException],
      [new UnexpectedZoneError(), BadRequestException],
      [new ZoneNotFoundError(), NotFoundException],
      [new UserNotFoundError(), NotFoundException],
    ])('maps %s to an HTTP error', async (error, expected) => {
      const { controller, assignUserRoleUseCase } = setup();
      assignUserRoleUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.assignRole(1, { role: UserRole.DIRECTOR_REGIONAL }),
      ).rejects.toThrow(expected);
    });

    it('rethrows unexpected errors', async () => {
      const { controller, assignUserRoleUseCase } = setup();
      const err = new Error('boom');
      assignUserRoleUseCase.execute.mockRejectedValue(err);

      await expect(
        controller.assignRole(1, { role: UserRole.ADMIN }),
      ).rejects.toThrow(err);
    });
  });
});
