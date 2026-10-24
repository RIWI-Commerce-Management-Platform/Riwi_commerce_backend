import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Caso de uso: Alternar estado activo/inactivo de una ruta comercial (HU-21).
 * 
 * En este caso de uso:
 * 1. Busco la ruta y verifico los permisos territoriales del Director Regional.
 * 2. Si la ruta está activa, la desactivo lógicamente (`is_active = false`, status = INACTIVE).
 * 3. Si la ruta estaba inactiva, la reactivo (`is_active = true`).
 * 4. Persisto el nuevo estado en el repositorio.
 */
@Injectable()
export class ToggleRouteStatusUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(routeId: number, actor?: AuthActor): Promise<Route> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new RouteNotFoundError(routeId);
    }

    // 1. Verifico la seguridad de zona
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== route.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, route.zoneId);
      }
    }

    // 2. Alterno el estado lógico
    if (route.isActive) {
      route.deactivate();
    } else {
      route.activate();
    }

    // 3. Guardo y retorno
    return await this.routeRepository.save(route);
  }
}
