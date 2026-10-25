import { Route } from './route.entity.js';
import { RouteFilterCriteria } from './route-filter.criteria.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

/**
 * DAO port for the Route aggregate. The application layer depends on
 * it; TypeOrmRouteDao implements it in the infrastructure layer.
 */
export abstract class RouteDao {
  /**
   * Finds a route by id, including its ordered stops.
   */
  abstract findById(id: number): Promise<Route | null>;

  /**
   * Finds a route by name within a zone, to reject duplicate names in the
   * same territory.
   */
  abstract findByNameAndZone(
    name: string,
    zoneId: number,
  ): Promise<Route | null>;

  /**
   * Paginated, filtered route list for supervision (HU-21).
   */
  abstract findPaginated(
    criteria: RouteFilterCriteria,
  ): Promise<PaginatedResult<Route>>;

  /**
   * Inserts or updates a route and all of its stops atomically.
   */
  abstract save(route: Route): Promise<Route>;

  /**
   * Physically deletes a route. Deactivation is the normal path; this is
   * only for exceptional cases.
   */
  abstract delete(id: number): Promise<void>;
}
