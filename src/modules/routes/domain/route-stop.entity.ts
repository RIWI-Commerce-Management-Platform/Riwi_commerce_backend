/**
 * Properties needed to build a client stop of a route.
 */
export interface RouteStopProps {
  id?: number;
  routeId?: number;
  clientId: number;
  visitOrder: number;
  suggestedTime?: string | null;
  estimatedDurationMinutes?: number;
  createdAt?: Date;
}

/**
 * A stop of a commercial route (RUTA_CLIENTE): a client with its sequential
 * visit order (1, 2, 3...), a suggested arrival time and an estimated
 * duration of the visit.
 */
export class RouteStop {
  readonly id?: number;
  readonly routeId?: number;
  readonly clientId: number;
  visitOrder: number;
  suggestedTime: string | null;
  estimatedDurationMinutes: number;
  readonly createdAt: Date;

  constructor(props: RouteStopProps) {
    if (props.visitOrder < 1) {
      throw new Error('visitOrder must be greater than or equal to 1');
    }
    this.id = props.id;
    this.routeId = props.routeId;
    this.clientId = props.clientId;
    this.visitOrder = props.visitOrder;
    this.suggestedTime = props.suggestedTime ?? null;
    this.estimatedDurationMinutes = props.estimatedDurationMinutes ?? 30;
    this.createdAt = props.createdAt ?? new Date();
  }

  /**
   * Changes the position of this stop in the route.
   */
  changeOrder(newOrder: number): void {
    if (newOrder < 1) {
      throw new Error('visitOrder must be greater than or equal to 1');
    }
    this.visitOrder = newOrder;
  }

  /**
   * Sets the suggested visit time (e.g. '09:30:00').
   */
  updateSuggestedTime(time: string | null): void {
    this.suggestedTime = time;
  }

  /**
   * Sets how many minutes the advisor is expected to spend with this client.
   */
  updateEstimatedDuration(minutes: number): void {
    if (minutes <= 0) {
      throw new Error('estimatedDurationMinutes must be greater than 0');
    }
    this.estimatedDurationMinutes = minutes;
  }
}
