/**
 * Estado del ciclo de vida de una ruta comercial.
 * 
 * En mi modelo de negocio, una ruta pasa por los siguientes estados:
 * - DRAFT: Borrador en construcción (Paso 1 y 2 del Wizard de creación).
 * - ASSIGNED: Asignada oficialmente a un asesor comercial y con visitas generadas en su agenda (Paso 3).
 * - INACTIVE: Desactivada lógicamente para pausar su operación sin perder el historial.
 */
export enum RouteStatus {
  DRAFT = 'DRAFT',
  ASSIGNED = 'ASSIGNED',
  INACTIVE = 'INACTIVE',
}
