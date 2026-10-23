import { Injectable } from '@nestjs/common';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { RouteStatus } from '../domain/route-status.enum.js';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNameAlreadyExistsError } from '../domain/errors/route-name-already-exists.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Parámetros de entrada para la creación del borrador de una ruta (Paso 1 del Wizard - HU-17).
 */
export interface CreateRouteDraftCommand {
  name: string;
  description?: string | null;
  zoneId: number;
  dayOfWeek: DayOfWeek;
  frequency: RouteFrequency;
  startTime?: string | null;
  endTime?: string | null;
  startDate: Date;
  endDate?: Date | null;
}

/**
 * Caso de uso: Crear ruta comercial en estado borrador (HU-17).
 *
 * En este caso de uso implemento el Paso 1 del Wizard de creación de rutas:
 * 1. Valido que si el usuario es Director Regional, pertenezca a la zona de la ruta.
 * 2. Valido que el nombre de la ruta no esté repetido en la misma zona.
 * 3. Instancio y persisto la ruta con estado DRAFT para permitir guardar el avance.
 */
@Injectable()
export class CreateRouteDraftUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(
    command: CreateRouteDraftCommand,
    actor?: AuthActor,
  ): Promise<Route> {
    // 1. Verifico la seguridad territorial del Director Regional
    if (actor && actor.role === UserRole.DIRECTOR_REGIONAL) {
      if (actor.zoneId && actor.zoneId !== command.zoneId) {
        throw new UnauthorizedZoneError(actor.zoneId, command.zoneId);
      }
    }

    // 2. Verifico que el nombre no exista ya en la misma zona comercial
    const existing = await this.routeRepository.findByNameAndZone(
      command.name,
      command.zoneId,
    );
    if (existing) {
      throw new RouteNameAlreadyExistsError(command.name, command.zoneId);
    }

    // 3. Creo mi entidad de dominio en estado DRAFT
    const route = new Route({
      name: command.name,
      description: command.description,
      zoneId: command.zoneId,
      dayOfWeek: command.dayOfWeek,
      frequency: command.frequency,
      startTime: command.startTime,
      endTime: command.endTime,
      startDate: command.startDate,
      endDate: command.endDate,
      status: RouteStatus.DRAFT,
    });

    // 4. Persisto el nuevo borrador en el repositorio
    return await this.routeRepository.save(route);
  }
}
