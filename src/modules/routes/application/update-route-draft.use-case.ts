import { Injectable } from '@nestjs/common';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { RouteNameAlreadyExistsError } from '../domain/errors/route-name-already-exists.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Parámetros permitidos para actualizar los datos generales de una ruta existente.
 */
export interface UpdateRouteDraftCommand {
  name?: string;
  description?: string | null;
  zoneId?: number;
  dayOfWeek?: DayOfWeek;
  frequency?: RouteFrequency;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: Date;
  endDate?: Date | null;
}

/**
 * Caso de uso: Actualizar datos generales de una ruta comercial (HU-17 y HU-21).
 *
 * En este caso de uso:
 * 1. Busco la ruta y verifico que exista.
 * 2. Valido que el Director Regional tenga permisos sobre la zona territorial.
 * 3. Si se cambia el nombre, valido que no colisione con otra ruta en la misma zona.
 * 4. Aplico los cambios a la entidad y persisto.
 */
@Injectable()
export class UpdateRouteDraftUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(
    routeId: number,
    command: UpdateRouteDraftCommand,
    actor?: AuthActor,
  ): Promise<Route> {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new RouteNotFoundError(routeId);
    }

    // 1. Verifico la seguridad de zona
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== route.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, route.zoneId);
      }
      if (command.zoneId && actor.zoneId && command.zoneId !== actor.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, command.zoneId);
      }
    }

    // 2. Si cambia el nombre o la zona, valido unicidad
    const targetZoneId = command.zoneId ?? route.zoneId;
    if (
      command.name &&
      (command.name !== route.name || targetZoneId !== route.zoneId)
    ) {
      const existing = await this.routeRepository.findByNameAndZone(
        command.name,
        targetZoneId,
      );
      if (existing && existing.id !== route.id) {
        throw new RouteNameAlreadyExistsError(command.name, targetZoneId);
      }
    }

    // 3. Actualizo la entidad con mis reglas de dominio
    route.updateGeneralInfo(command);

    // 4. Guardo los cambios
    return await this.routeRepository.save(route);
  }
}
