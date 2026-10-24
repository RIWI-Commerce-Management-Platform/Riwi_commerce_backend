/**
 * Propiedades necesarias para instanciar una parada de cliente dentro de mi ruta comercial.
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
 * Entidad de dominio que representa una parada específica dentro de la ruta comercial (RUTA_CLIENTE).
 *
 * En mi modelo, cada parada asocia a un cliente con un orden de visita secuencial (1, 2, 3...),
 * una hora sugerida de llegada y un tiempo estimado de atención comercial.
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
   * Con este método actualizo la posición secuencial de esta parada en mi recorrido.
   */
  changeOrder(newOrder: number): void {
    if (newOrder < 1) {
      throw new Error('visitOrder must be greater than or equal to 1');
    }
    this.visitOrder = newOrder;
  }

  /**
   * Con este método establezco o modifico la hora sugerida de visita (ej: '09:30:00').
   */
  updateSuggestedTime(time: string | null): void {
    this.suggestedTime = time;
  }

  /**
   * Con este método ajusto la estimación de tiempo (en minutos) que el asesor dedicará a este cliente.
   */
  updateEstimatedDuration(minutes: number): void {
    if (minutes <= 0) {
      throw new Error('estimatedDurationMinutes must be greater than 0');
    }
    this.estimatedDurationMinutes = minutes;
  }
}
