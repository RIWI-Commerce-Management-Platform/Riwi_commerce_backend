/**
 * Error de dominio lanzado cuando un Director Regional intenta crear, modificar
 * o consultar una ruta que pertenece a una zona geográfica distinta a la suya.
 *
 * Regla de negocio de seguridad: Cada Director Regional está limitado a su territorio asignado.
 */
export class UnauthorizedZoneError extends Error {
  constructor(userZoneId: number, targetZoneId: number) {
    super(
      `Regional director assigned to zone ${userZoneId} cannot manage routes in zone ${targetZoneId}`,
    );
    this.name = 'UnauthorizedZoneError';
  }
}
