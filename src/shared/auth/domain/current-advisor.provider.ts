/** Shape of the request after the global SessionGuard has run. */
export interface AuthenticatedRequest {
  user?: { id?: unknown };
}

/**
 * Abstract port that resolves the authenticated advisor for a request.
 * Consumed by controllers so modules never read the session directly.
 */
export abstract class CurrentAdvisorProvider {
  abstract extract(request: object): Promise<number>;
}
