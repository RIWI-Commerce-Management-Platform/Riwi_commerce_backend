import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScheduleVisitsCommand,
  VisitSchedulerPort,
} from '../application/ports/visit-scheduler.port.js';
import { DayOfWeek } from '../domain/day-of-week.enum.js';
import { RouteFrequency } from '../domain/route-frequency.enum.js';
import { VisitOrmEntity } from '../../visit/infrastructure/visit.orm-entity.js';

/**
 * Adaptador de infraestructura que implementa `VisitSchedulerPort` (HU-20).
 *
 * En este adaptador materializo la integración clave con el módulo de Visitas de Camilo (Épica E4):
 * Al asignar una ruta a un asesor comercial, calculo las fechas efectivas de recorrido
 * según el día de la semana y la frecuencia configurada, creando automáticamente los registros
 * en la tabla `visits` en estado PENDING para que aparezcan de inmediato en la agenda del asesor.
 */
@Injectable()
export class TypeOrmVisitSchedulerAdapter implements VisitSchedulerPort {
  constructor(
    @InjectRepository(VisitOrmEntity)
    private readonly visitRepository: Repository<VisitOrmEntity>,
  ) {}

  /**
   * Con este método genero las visitas programadas en la tabla `visits` de PostgreSQL.
   */
  async scheduleVisitsForRoute(
    command: ScheduleVisitsCommand,
  ): Promise<number> {
    if (command.stops.length === 0) {
      return 0;
    }

    const scheduledDates = this._computeScheduledDates(
      command.startDate,
      command.endDate,
      command.dayOfWeek,
      command.frequency,
    );

    const visitsToInsert: VisitOrmEntity[] = [];

    for (const date of scheduledDates) {
      for (const stop of command.stops) {
        const visit = new VisitOrmEntity();
        visit.clientId = stop.clientId;
        visit.advisorId = command.advisorId;
        visit.routeId = command.routeId;
        visit.scheduledAt = this._combineDateAndTime(date, stop.suggestedTime);
        visit.status = 'PENDING';
        visit.objective = `Visita programada de ruta (Parada #${stop.visitOrder})`;
        visit.observations = null;
        visit.actualDate = null;
        visit.startTime = null;
        visit.endTime = null;
        visitsToInsert.push(visit);
      }
    }

    if (visitsToInsert.length === 0) {
      return 0;
    }

    const saved = await this.visitRepository.save(visitsToInsert);
    return saved.length;
  }

  /**
   * Calcula las fechas exactas en el calendario que coinciden con el día de la semana y frecuencia.
   */
  private _computeScheduledDates(
    startDate: Date,
    endDate: Date | null | undefined,
    dayOfWeek: DayOfWeek,
    frequency: RouteFrequency,
  ): Date[] {
    const targetDayIndex = this._mapDayOfWeekToIndex(dayOfWeek);
    const start = new Date(startDate);

    // Ajusto la fecha de inicio al primer día que coincida con el día de la semana
    while (start.getUTCDay() !== targetDayIndex) {
      start.setUTCDate(start.getUTCDate() + 1);
    }

    // Si no hay fecha fin, proyecto un horizonte de 4 semanas
    const horizonLimit = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 28 * 24 * 60 * 60 * 1000);

    const stepDays = this._getFrequencyStepDays(frequency);
    const dates: Date[] = [];

    const current = new Date(start);
    while (current <= horizonLimit && dates.length < 12) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + stepDays);
    }

    return dates;
  }

  /**
   * Mapea el enum DayOfWeek al índice estándar de JavaScript (0: Domingo, 1: Lunes, etc.).
   */
  private _mapDayOfWeekToIndex(day: DayOfWeek): number {
    switch (day) {
      case DayOfWeek.SUNDAY:
        return 0;
      case DayOfWeek.MONDAY:
        return 1;
      case DayOfWeek.TUESDAY:
        return 2;
      case DayOfWeek.WEDNESDAY:
        return 3;
      case DayOfWeek.THURSDAY:
        return 4;
      case DayOfWeek.FRIDAY:
        return 5;
      case DayOfWeek.SATURDAY:
        return 6;
    }
  }

  /**
   * Determina el salto en días según la frecuencia de repetición.
   */
  private _getFrequencyStepDays(frequency: RouteFrequency): number {
    switch (frequency) {
      case RouteFrequency.WEEKLY:
        return 7;
      case RouteFrequency.BIWEEKLY:
        return 14;
      case RouteFrequency.MONTHLY:
        return 28;
    }
  }

  /**
   * Combina la fecha programada con la hora sugerida de visita (ej: '09:30:00').
   */
  private _combineDateAndTime(date: Date, suggestedTime: string | null): Date {
    const combined = new Date(date);
    if (!suggestedTime) {
      combined.setUTCHours(9, 0, 0, 0); // Hora por defecto: 9:00 AM
      return combined;
    }

    const parts = suggestedTime.split(':').map((p) => Number.parseInt(p, 10));
    const hours = parts[0] || 9;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;

    combined.setUTCHours(hours, minutes, seconds, 0);
    return combined;
  }
}
