import { Injectable } from '@nestjs/common';
import { Route } from '../domain/route.entity.js';
import { RouteRepository } from '../domain/route.repository.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { VisitSchedulerPort } from './ports/visit-scheduler.port.js';
import { AuthActor } from './dto/auth-actor.dto.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

/**
 * Caso de uso: Asignar una ruta comercial a un asesor y programar sus visitas (HU-20).
 *
 * En este caso de uso implemento el Paso 3 del Wizard:
 * 1. Busco la ruta y verifico los permisos territoriales del Director Regional.
 * 2. Asigno el asesor a la ruta mediante el método de dominio `assignAdvisor()`,
 *    el cual valida que la ruta contenga paradas y cambia su estado a ASSIGNED.
 * 3. Persisto la ruta con su nuevo estado y asesor.
 * 4. Invoco el puerto `VisitSchedulerPort` para generar de forma automática
 *    las visitas programadas en la agenda de Camilo (Épica E4) según el día y frecuencia.
 */
@Injectable()
export class AssignRouteAdvisorUseCase {
  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly visitScheduler: VisitSchedulerPort,
  ) {}

  async execute(
    routeId: number,
    advisorId: number,
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
    }

    // 2. Asigno el asesor en el agregado (valida paradas y pasa a ASSIGNED)
    route.assignAdvisor(advisorId);

    // 3. Guardo el estado de la ruta asignada
    const savedRoute = await this.routeRepository.save(route);

    // 4. Programo automáticamente las visitas en la agenda del asesor (Camilo E4)
    await this.visitScheduler.scheduleVisitsForRoute({
      routeId: savedRoute.id!,
      advisorId,
      dayOfWeek: savedRoute.dayOfWeek,
      frequency: savedRoute.frequency,
      startDate: savedRoute.startDate,
      endDate: savedRoute.endDate,
      stops: savedRoute.stops.map((stop) => ({
        clientId: stop.clientId,
        visitOrder: stop.visitOrder,
        suggestedTime: stop.suggestedTime,
        estimatedDurationMinutes: stop.estimatedDurationMinutes,
      })),
    });

    return savedRoute;
  }
}
