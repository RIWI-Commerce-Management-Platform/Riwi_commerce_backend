import { DayOfWeek } from './day-of-week.enum.js';
import { RouteFrequency } from './route-frequency.enum.js';
import { RouteStatus } from './route-status.enum.js';
import { RouteStop } from './route-stop.entity.js';
import { RouteHasNoStopsError } from './errors/route-has-no-stops.error.js';
import { ClientAlreadyInRouteError } from './errors/client-already-in-route.error.js';
import { ClientNotInRouteError } from './errors/client-not-in-route.error.js';
import { InvalidStopOrderError } from './errors/invalid-stop-order.error.js';

/**
 * Properties needed to build a commercial route.
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
 * General route data that can be updated (wizard step 1).
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
 * Aggregate root for a commercial route (RUTA, epic E3). It holds the route
 * planning rules: draft creation, ordered stops, distance/time metrics and
 * the final assignment to an advisor.
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
   * The stops sorted by visitOrder.
   */
  get stops(): RouteStop[] {
    return [...this._stops];
  }

  /**
   * Assigns the route to an advisor (wizard step 3, HU-20).
   *
   * The route must be active and have at least one stop; it then moves to
   * ASSIGNED.
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
   * Adds a client as a new stop at the end of the route (HU-18). A client
   * can't appear twice in the same route.
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
   * Removes a client's stop (HU-18) and renumbers the remaining stops so the
   * visit order stays consecutive (1, 2, 3...).
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
   * Reorders every stop from a sequence of client ids (HU-18, HU-19). Backs
   * the frontend drag-and-drop and the map refresh.
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
   * Updates the total distance and estimated time (HU-22).
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
   * Updates the general route data (HU-17).
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
   * Soft-deactivates the route.
   */
  deactivate(): void {
    this.isActive = false;
    this.status = RouteStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Reactivates a deactivated route.
   */
  activate(): void {
    this.isActive = true;
    this.status = this.advisorId ? RouteStatus.ASSIGNED : RouteStatus.DRAFT;
    this.updatedAt = new Date();
  }

  /**
   * Keeps visitOrder consecutive (1..N).
   */
  private _reindexStops(): void {
    this._stops.forEach((stop, index) => {
      stop.changeOrder(index + 1);
    });
  }
}
