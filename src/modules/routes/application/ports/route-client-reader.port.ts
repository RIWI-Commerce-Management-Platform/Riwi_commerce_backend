/**
 * Basic commercial and location data of a client needed to plan routes.
 */
export interface RouteClientDetails {
  id: number;
  commercialName: string;
  address: string;
  municipality: string;
  zoneId: number;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

/**
 * Client read port for the routes module, so it can read clients and their
 * coordinates without depending on the clients module's tables (epic E2).
 */
export abstract class RouteClientReaderPort {
  /**
   * Details and coordinates of one client.
   */
  abstract findById(id: number): Promise<RouteClientDetails | null>;

  /**
   * Details and coordinates of several clients in one query.
   */
  abstract findByIds(ids: number[]): Promise<RouteClientDetails[]>;
}
