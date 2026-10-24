import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteFilterCriteria } from '../domain/route-filter.criteria.js';
import { RouteRepository } from '../domain/route.repository.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Caso de uso: Consultar y listar rutas comerciales con filtros y paginación (HU-21).
 * 
 * En este caso de uso:
 * 1. Aplico restricciones de seguridad basadas en roles (RBAC):
 *    - Si el usuario es Director Regional, fuerzo la consulta a su zona asignada.
 *    - Si es Administrador, permito filtrar libremente por cualquier zona o asesor.
 * 2. Ejecuto la consulta paginada a través de `RouteRepository`.
 * 3. Retorno el resultado paginado con metadatos.
 */
@Injectable()
export class FindRoutesUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(
    criteria: RouteFilterCriteria,
    actor?: AuthActor,
  ): Promise<PaginatedResult<Route>> {
    const scopedCriteria: RouteFilterCriteria = { ...criteria };

    // 1. Aplico el alcance territorial según el rol
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId) {
        scopedCriteria.zoneId = actor.zoneId;
      }
    }

    // 2. Consulto las rutas en el repositorio
    return await this.routeRepository.findPaginated(scopedCriteria);
  }
}
