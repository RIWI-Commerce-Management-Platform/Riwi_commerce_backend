import { UserRole } from '../../../auth/domain/user-role.enum.js';

/**
 * Representa el contexto del usuario autenticado que ejecuta una acción sobre el módulo de rutas.
 * 
 * En mi arquitectura de seguridad:
 * - ADMIN: Puede gestionar rutas de cualquier zona.
 * - DIRECTOR_REGIONAL: Solo puede gestionar rutas de su zona asignada (zoneId).
 * - ASESOR: Solo puede consultar sus propias rutas asignadas.
 */
export interface AuthActor {
  id: string;
  role: UserRole;
  zoneId?: number | null;
}
