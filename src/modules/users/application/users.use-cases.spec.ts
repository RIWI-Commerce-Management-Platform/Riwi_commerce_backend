import { describe, expect, it, vi } from 'vitest';
import { ListUsersUseCase } from './list-users.use-case.js';
import { GetUserByIdUseCase } from './get-user-by-id.use-case.js';
import { UserDao } from '../domain/user.dao.js';
import { User } from '../domain/user.entity.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { UserNotFoundError } from '../../auth/domain/errors/user-not-found.error.js';

const user = new User({
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  emailVerified: false,
  role: UserRole.ADMIN,
  zoneId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const createDao = (): UserDao => ({
  findById: vi.fn().mockResolvedValue(user),
  findPaginated: vi.fn().mockResolvedValue({
    data: [user],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }),
});

describe('ListUsersUseCase', () => {
  it('passes the filters to the dao', async () => {
    const dao = createDao();
    const criteria = { role: UserRole.ASESOR, page: 2, limit: 5 };

    const result = await new ListUsersUseCase(dao).execute(criteria);

    expect(dao.findPaginated).toHaveBeenCalledWith(criteria);
    expect(result.data).toEqual([user]);
  });
});

describe('GetUserByIdUseCase', () => {
  it('returns the user', async () => {
    const dao = createDao();
    await expect(new GetUserByIdUseCase(dao).execute(1)).resolves.toBe(user);
    expect(dao.findById).toHaveBeenCalledWith(1);
  });

  it('throws UserNotFoundError when the user does not exist', async () => {
    const dao = createDao();
    vi.mocked(dao.findById).mockResolvedValueOnce(null);

    await expect(
      new GetUserByIdUseCase(dao).execute(99),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
