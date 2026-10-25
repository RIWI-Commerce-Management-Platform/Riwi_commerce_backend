import { VisitStatus } from '../../visit/domain/visit.entity.js';

/** The day of operation is measured in Colombian time. */
export const BUSINESS_TIMEZONE = 'America/Bogota';

/** Marker categories of the HU-36 design legend. */
export enum MapStatus {
  VISITED = 'VISITED', // Visitado
  PENDING = 'PENDING', // Pendiente
  NOT_VISITED = 'NOT_VISITED', // Sin visitar
  ORDER_CLOSED = 'ORDER_CLOSED', // Pedido cerrado
  RESCHEDULED = 'RESCHEDULED', // Reprogramado
}

/**
 * Legend category of a visit. "Pedido cerrado" is not a visit status: it is
 * a visit that generated an order (HU-27 `order_generated`), which can only
 * be set on a visit in progress or done. IN_PROGRESS is not in the legend;
 * until it is finished it shows as pending.
 */
export function mapStatusOf(
  status: string,
  orderGenerated: boolean,
): MapStatus {
  if (orderGenerated) return MapStatus.ORDER_CLOSED;
  switch (status) {
    case VisitStatus.VISITED:
      return MapStatus.VISITED;
    case VisitStatus.NOT_VISITED:
      return MapStatus.NOT_VISITED;
    case VisitStatus.RESCHEDULE:
      return MapStatus.RESCHEDULED;
    default:
      return MapStatus.PENDING;
  }
}

export interface VisitMapFilters {
  /** 'YYYY-MM-DD'; defaults to today in Bogotá. */
  date?: string;
  /** Zone (territory) of the client. */
  territoryId?: number;
  advisorId?: number;
}

/** A visit of the day as read from PostgreSQL. */
export interface VisitMapRow {
  visitId: number;
  scheduledAt: Date;
  status: string;
  orderGenerated: boolean;
  /** null when the client has no valid coordinates. */
  location: { latitude: number; longitude: number } | null;
  client: {
    id: number;
    commercialName: string;
    address: string;
    municipality: string;
  };
  zone: { id: number; name: string };
  advisor: { id: number; name: string | null };
  route: { id: number; name: string } | null;
}

export interface VisitMapDay {
  /** 'YYYY-MM-DD' actually used. */
  date: string;
  rows: VisitMapRow[];
}

export interface VisitMapMarker extends VisitMapRow {
  mapStatus: MapStatus;
}

export interface VisitMap {
  date: string;
  total: number;
  withoutLocation: number;
  /** Visits per legend category, with or without location. */
  counts: Record<MapStatus, number>;
  data: VisitMapMarker[];
}
