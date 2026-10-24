import { UserRole } from '../../../auth/domain/user-role.enum.js';

/**
 * The authenticated user acting on the routes module:
 * - ADMIN: manages routes in any zone.
 * - DIRECTOR_REGIONAL: only manages routes in their zone (zoneId).
 * - ASESOR: only reads the routes assigned to them.
 */
export interface AuthActor {
  id: number;
  role: UserRole;
  zoneId?: number | null;
}
