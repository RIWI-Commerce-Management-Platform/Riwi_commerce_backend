/**
 * Error de dominio lanzado cuando la lista de paradas enviada para reordenar
 * no coincide exactamente con los clientes que pertenecen a la ruta (faltan paradas o hay paradas desconocidas).
 */
export class InvalidStopOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStopOrderError';
  }
}
