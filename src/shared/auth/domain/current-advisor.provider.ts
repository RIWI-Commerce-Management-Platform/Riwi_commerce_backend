export interface CurrentAdvisorRequest {
  user?: {
    role?: string;
    idAsesor?: number | null;
  };
}

/**
 * Abstract port that resolves the authenticated advisor for a request.
 * Consumed by controllers so modules never read auth headers directly.
 */
export abstract class CurrentAdvisorProvider {
  abstract extract(request: CurrentAdvisorRequest): Promise<number | null>;
}
