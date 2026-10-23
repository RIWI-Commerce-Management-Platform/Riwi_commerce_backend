import { Route } from './route.entity.js';
import { RouteFilterCriteria } from './route-filter.criteria.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

/**
 * Puerto de repositorio para el agregado Route.
 *
 * En mi arquitectura limpia, este contrato abstracto define las operaciones de persistencia
 * que necesita mi capa de aplicación sin depender de TypeORM ni de la base de datos concreta.
 * La implementación real residirá en la capa de infraestructura (TypeOrmRouteRepository).
 */
export abstract class RouteRepository {
  /**
   * Con este método busco una ruta por su ID numérico incluyendo sus paradas ordenadas.
   */
  abstract findById(id: number): Promise<Route | null>;

  /**
   * Con este método busco una ruta por nombre dentro de una zona específica,
   * para validar que no existan duplicados en el mismo territorio.
   */
  abstract findByNameAndZone(
    name: string,
    zoneId: number,
  ): Promise<Route | null>;

  /**
   * Con este método obtengo un listado paginado y filtrado de rutas para supervisión (HU-21).
   */
  abstract findPaginated(
    criteria: RouteFilterCriteria,
  ): Promise<PaginatedResult<Route>>;

  /**
   * Con este método guardo o actualizo una ruta y todas sus paradas de manera atómica.
   */
  abstract save(route: Route): Promise<Route>;

  /**
   * Con este método elimino físicamente una ruta si fuese requerido (aunque priorizamos desactivación lógica).
   */
  abstract delete(id: number): Promise<void>;
}
