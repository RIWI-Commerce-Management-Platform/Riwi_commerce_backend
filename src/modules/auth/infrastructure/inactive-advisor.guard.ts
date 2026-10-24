import type { Pool } from 'pg';

/**
 * True when the user has an advisor profile marked inactive (HU-07). Users
 * without a profile (admins, directors, legacy advisors) are never blocked.
 */
export async function isInactiveAdvisor(
  pool: Pick<Pool, 'query'>,
  userId: number | string,
): Promise<boolean> {
  const { rows } = await pool.query<{ is_active: boolean }>(
    'SELECT "is_active" FROM "advisors" WHERE "user_id" = $1',
    [Number(userId)],
  );
  return rows.length > 0 && rows[0].is_active === false;
}
