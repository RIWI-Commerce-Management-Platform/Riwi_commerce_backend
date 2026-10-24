import { DayOfWeek } from './day-of-week.enum.js';
import { RouteFrequency } from './route-frequency.enum.js';
import { RouteStatus } from './route-status.enum.js';
import { RouteStop } from './route-stop.entity.js';
import { RouteHasNoStopsError } from './errors/route-has-no-stops.error.js';
import { ClientAlreadyInRouteError } from './errors/client-already-in-route.error.js';
import { ClientNotInRouteError } from './errors/client-not-in-route.error.js';
import { InvalidStopOrderError } from './errors/invalid-stop-order.error.js';

/**
 * Propiedades necesarias para construir una ruta comercial completa en mi dominio.
 */
export interface RouteProps {
  id?: number;
  name: string;
  description?: string | null;
  zoneId: number;
  advisorId?: number | null;
  dayOfWeek: DayOfWeek;
  frequency: RouteFrequency;
  startTime?: string | null;
  endTime?: string | null;
  startDate: Date;
  endDate?: Date | null;
  status?: RouteStatus;
  totalDistanceKm?: number | null;
  estimatedDurationMinutes?: number | null;
  stops?: RouteStop[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Parámetros que permito actualizar sobre los datos generales de mi ruta (Paso 1 del Wizard).
 */
export interface UpdateRouteGeneralInfoProps {
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
 * Entidad raíz de agregado (Aggregate Root) que representa una Ruta Comercial (RUTA).
 *
 * En mi rol como Alejandro (E3), diseño esta clase pura para encapsular todas las reglas
 * de negocio de planeación territorial: creación en borrador, gestión de paradas ordenadas,
 * cálculo de distancia/tiempo y asignación final a un asesor comercial.
 */
export class Route {
  readonly id?: number;
  name: string;
  description: string | null;
  zoneId: number;
  advisorId: number | null;
  dayOfWeek: DayOfWeek;
  frequency: RouteFrequency;
  startTime: string | null;
  endTime: string | null;
  startDate: Date;
  endDate: Date | null;
  status: RouteStatus;
  totalDistanceKm: number | null;
  estimatedDurationMinutes: number | null;
  private _stops: RouteStop[];
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: RouteProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Route name cannot be empty');
    }
    if (!props.zoneId || props.zoneId <= 0) {
      throw new Error('Zone ID must be a valid positive integer');
    }

    this.id = props.id;
    this.name = props.name.trim();
    this.description = props.description ?? null;
    this.zoneId = props.zoneId;
    this.advisorId = props.advisorId ?? null;
    this.dayOfWeek = props.dayOfWeek;
    this.frequency = props.frequency;
    this.startTime = props.startTime ?? null;
    this.endTime = props.endTime ?? null;
    this.startDate = props.startDate;
    this.endDate = props.endDate ?? null;
    this.status = props.status ?? RouteStatus.DRAFT;
    this.totalDistanceKm = props.totalDistanceKm ?? null;
    this.estimatedDurationMinutes = props.estimatedDurationMinutes ?? null;
    this._stops = props.stops
      ? [...props.stops].sort((a, b) => a.visitOrder - b.visitOrder)
      : [];
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Obtengo la lista de paradas ordenadas secuencialmente por visitOrder.
   */
  get stops(): RouteStop[] {
    return [...this._stops];
  }

  /**
   * Con este método asigno mi ruta a un asesor comercial (Paso 3 del Wizard - HU-20).
   *
   * Regla de negocio:
   * 1. La ruta debe estar activa.
   * 2. La ruta debe tener al menos una parada de cliente configurada.
   * 3. Al asignarse, su estado pasa formalmente a 'ASSIGNED'.
   */
  assignAdvisor(advisorId: number): void {
    if (!this.isActive) {
      throw new Error('Cannot assign an inactive route');
    }
    if (this._stops.length === 0) {
      throw new RouteHasNoStopsError(this.id);
    }
    if (!advisorId || advisorId <= 0) {
      throw new Error('Advisor ID must be a valid positive integer');
    }

    this.advisorId = advisorId;
    this.status = RouteStatus.ASSIGNED;
    this.updatedAt = new Date();
  }

  /**
   * Con este método agrego un cliente como nueva parada al final del recorrido (HU-18).
   *
   * Regla de negocio:
   * Evito duplicar el cliente en la misma ruta y asigno el siguiente número de orden correlativo.
   */
  addStop(
    clientId: number,
    suggestedTime?: string | null,
    estimatedDurationMinutes?: number,
  ): RouteStop {
    if (this._stops.some((s) => s.clientId === clientId)) {
      throw new ClientAlreadyInRouteError(clientId, this.id);
    }

    const nextOrder = this._stops.length + 1;
    const newStop = new RouteStop({
      routeId: this.id,
      clientId,
      visitOrder: nextOrder,
      suggestedTime,
      estimatedDurationMinutes,
    });

    this._stops.push(newStop);
    this.updatedAt = new Date();
    return newStop;
  }

  /**
   * Con este método remuevo un cliente de las paradas de la ruta (HU-18).
   *
   * Regla de negocio:
   * Al eliminar la parada, reindexo de inmediato las paradas restantes para que
   * el orden de visita (1, 2, 3...) se conserve estrictamente consecutivo.
   */
  removeStop(clientId: number): void {
    const stopIndex = this._stops.findIndex((s) => s.clientId === clientId);
    if (stopIndex === -1) {
      throw new ClientNotInRouteError(clientId, this.id);
    }

    this._stops.splice(stopIndex, 1);
    this._reindexStops();
    this.updatedAt = new Date();
  }

  /**
   * Con este método reordeno todas las paradas de la ruta mediante una secuencia de IDs de clientes (HU-18 y HU-19).
   *
   * Este método es la base técnica para el drag-and-drop del frontend y la actualización del mapa interactivo.
   */
  reorderStops(orderedClientIds: number[]): void {
    if (orderedClientIds.length !== this._stops.length) {
      throw new InvalidStopOrderError(
        `Received ${orderedClientIds.length} stops to reorder, but route has ${this._stops.length}`,
      );
    }

    const currentClientIds = new Set(this._stops.map((s) => s.clientId));
    for (const clientId of orderedClientIds) {
      if (!currentClientIds.has(clientId)) {
        throw new InvalidStopOrderError(
          `Client id ${clientId} does not exist among the current route stops`,
        );
      }
    }

    const stopMap = new Map<number, RouteStop>(
      this._stops.map((s) => [s.clientId, s]),
    );

    const reordered: RouteStop[] = [];
    orderedClientIds.forEach((clientId, index) => {
      const stop = stopMap.get(clientId)!;
      stop.changeOrder(index + 1);
      reordered.push(stop);
    });

    this._stops = reordered;
    this.updatedAt = new Date();
  }

  /**
   * Con este método actualizo los cálculos de distancia total y tiempo estimado (HU-22).
   */
  updateMetrics(
    totalDistanceKm: number,
    estimatedDurationMinutes: number,
  ): void {
    if (totalDistanceKm < 0) {
      throw new Error('totalDistanceKm cannot be negative');
    }
    if (estimatedDurationMinutes < 0) {
      throw new Error('estimatedDurationMinutes cannot be negative');
    }
    this.totalDistanceKm = totalDistanceKm;
    this.estimatedDurationMinutes = estimatedDurationMinutes;
    this.updatedAt = new Date();
  }

  /**
   * Con este método actualizo los datos generales de la ruta (HU-17).
   */
  updateGeneralInfo(props: UpdateRouteGeneralInfoProps): void {
    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        throw new Error('Route name cannot be empty');
      }
      this.name = props.name.trim();
    }
    if (props.description !== undefined) this.description = props.description;
    if (props.zoneId !== undefined) {
      if (props.zoneId <= 0)
        throw new Error('Zone ID must be a positive integer');
      this.zoneId = props.zoneId;
    }
    if (props.dayOfWeek !== undefined) this.dayOfWeek = props.dayOfWeek;
    if (props.frequency !== undefined) this.frequency = props.frequency;
    if (props.startTime !== undefined) this.startTime = props.startTime;
    if (props.endTime !== undefined) this.endTime = props.endTime;
    if (props.startDate !== undefined) this.startDate = props.startDate;
    if (props.endDate !== undefined) this.endDate = props.endDate;

    this.updatedAt = new Date();
  }

  /**
   * Con este método desactivo lógicamente la ruta (soft delete).
   */
  deactivate(): void {
    this.isActive = false;
    this.status = RouteStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Con este método reactivo una ruta previamente desactivada.
   */
  activate(): void {
    this.isActive = true;
    this.status = this.advisorId ? RouteStatus.ASSIGNED : RouteStatus.DRAFT;
    this.updatedAt = new Date();
  }

  /**
   * Método auxiliar interno para garantizar que los índices de visitOrder sean siempre 1..N consecutivos.
   */
  private _reindexStops(): void {
    this._stops.forEach((stop, index) => {
      stop.changeOrder(index + 1);
    });
  }
}
