/**
 * Información geográfica y comercial básica de un cliente requerida para la planeación de rutas.
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
 * Puerto de lectura de clientes para el módulo de rutas.
 *
 * En mi arquitectura limpia, este puerto abstracto me permite consultar
 * los clientes y sus coordenadas geográficas sin acoplarme directamente
 * a las tablas ni a la base de datos de Yesid (Épica E2).
 */
export abstract class RouteClientReaderPort {
  /**
   * Con este método busco los detalles y coordenadas de un cliente por su ID.
   */
  abstract findById(id: number): Promise<RouteClientDetails | null>;

  /**
   * Con este método busco los detalles y coordenadas de un conjunto de clientes en lote.
   */
  abstract findByIds(ids: number[]): Promise<RouteClientDetails[]>;
}
