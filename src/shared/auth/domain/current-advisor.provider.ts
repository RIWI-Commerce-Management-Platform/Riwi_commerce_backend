export interface CurrentAdvisorRequest {
  headers: Record<string, unknown>;
}

/**
 * Abstract port that resolves the authenticated advisor for a request.
 * Consumed by controllers so modules never read auth headers directly.
 */
export abstract class CurrentAdvisorProvider {
  abstract extract(request: CurrentAdvisorRequest): Promise<number>;
}
