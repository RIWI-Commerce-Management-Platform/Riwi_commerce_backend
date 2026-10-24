import { describe, expect, it, vi } from 'vitest';
import { isInactiveAdvisor } from './inactive-advisor.guard.js';

describe('isInactiveAdvisor', () => {
  const poolReturning = (rows: unknown[]) => ({
    query: vi.fn().mockResolvedValue({ rows }),
  });

  it('blocks an advisor whose profile is inactive', async () => {
    const pool = poolReturning([{ is_active: false }]);
    await expect(isInactiveAdvisor(pool as any, '7')).resolves.toBe(true);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [7]);
  });

  it('lets an active advisor through', async () => {
    await expect(
      isInactiveAdvisor(poolReturning([{ is_active: true }]) as any, 7),
    ).resolves.toBe(false);
  });

  it('lets a user without an advisor profile through', async () => {
    await expect(isInactiveAdvisor(poolReturning([]) as any, 7)).resolves.toBe(
      false,
    );
  });
});
