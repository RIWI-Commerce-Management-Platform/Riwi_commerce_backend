/**
 * Frecuencia de repetición de la ruta comercial.
 * 
 * En mi modelo operativo, defino qué tan seguido se debe recorrer la ruta:
 * - WEEKLY: El recorrido se repite todas las semanas en el día configurado.
 * - BIWEEKLY: El recorrido se ejecuta cada dos semanas (quincenal).
 * - MONTHLY: El recorrido se ejecuta una vez al mes.
 */
export enum RouteFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}
