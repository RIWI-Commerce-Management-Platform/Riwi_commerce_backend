import { describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { UserRole } from '../domain/user-role.enum.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';

describe('GetCurrentUserUseCase', () => {
  it('should return user info when user exists', async () => {
    const mockUser = {
      id: 'user-123',
      role: UserRole.ASESOR,
      zoneId: 5,
    } as UserOrmEntity;

    const findOne = vi.fn().mockResolvedValue(mockUser);
    const mockRepo = { findOne } as unknown as Repository<UserOrmEntity>;

    const useCase = new GetCurrentUserUseCase(mockRepo);
    const result = await useCase.execute('user-123');

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: { id: true, role: true, zoneId: true },
    });
    expect(result).toEqual(mockUser);
  });

  it('should throw UserNotFoundError when user is not found', async () => {
    const findOne = vi.fn().mockResolvedValue(null);
    const mockRepo = { findOne } as unknown as Repository<UserOrmEntity>;

    const useCase = new GetCurrentUserUseCase(mockRepo);

    await expect(useCase.execute('non-existent')).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
