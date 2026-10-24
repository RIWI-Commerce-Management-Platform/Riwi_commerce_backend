export interface CurrentAdvisorRequest {
  user?: {
    role?: string;
    idAsesor?: number | null;
    [key: string]: any;
  };
  headers?: Record<string, unknown>;
  [key: string]: any;
}

/**
 * Abstract port that resolves the authenticated advisor for a request.
 * Consumed by controllers so modules never read auth headers directly.
 */
export abstract class CurrentAdvisorProvider {
  abstract extract(request: CurrentAdvisorRequest): Promise<number | null>;
}
