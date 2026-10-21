export interface ClientSnapshot {
  id: number;
  name: string;
  contactName: string | null;
  potential: string | null;
}

/**
 * Abstract port to read minimal client information (details, main contact,
 * potential) without querying another module's tables directly.
 */
export abstract class ClientReader {
  abstract findById(id: number): Promise<ClientSnapshot | null>;
}
