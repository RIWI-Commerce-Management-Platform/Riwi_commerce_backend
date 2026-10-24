import { describe, expect, it, vi } from 'vitest';
import { TypeOrmRouteAdvisorReaderAdapter } from './typeorm-route-advisor-reader.adapter.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('TypeOrmRouteAdvisorReaderAdapter', () => {
  const createAdapter = (user: unknown, profile: unknown) => {
    const userRepository = { findOne: vi.fn().mockResolvedValue(user) };
    const advisorRepository = { findOne: vi.fn().mockResolvedValue(profile) };
    return {
      adapter: new TypeOrmRouteAdvisorReaderAdapter(
        userRepository as any,
        advisorRepository as any,
      ),
      advisorRepository,
    };
  };

  it('returns false when the user does not exist', async () => {
    const { adapter, advisorRepository } = createAdapter(null, null);
    await expect(adapter.isActiveAdvisor(5)).resolves.toBe(false);
    expect(advisorRepository.findOne).not.toHaveBeenCalled();
  });

  it('returns false when the user is not an advisor', async () => {
    const { adapter } = createAdapter({ id: 5, role: UserRole.ADMIN }, null);
    await expect(adapter.isActiveAdvisor(5)).resolves.toBe(false);
  });

  it('returns true for an advisor without a profile', async () => {
    const { adapter } = createAdapter({ id: 5, role: UserRole.ASESOR }, null);
    await expect(adapter.isActiveAdvisor(5)).resolves.toBe(true);
  });

  it('follows the profile status when there is one', async () => {
    const active = createAdapter(
      { id: 5, role: UserRole.ASESOR },
      { userId: 5, isActive: true },
    );
    const inactive = createAdapter(
      { id: 5, role: UserRole.ASESOR },
      { userId: 5, isActive: false },
    );
    await expect(active.adapter.isActiveAdvisor(5)).resolves.toBe(true);
    await expect(inactive.adapter.isActiveAdvisor(5)).resolves.toBe(false);
  });
});
