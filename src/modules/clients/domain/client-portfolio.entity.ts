export interface ClientPortfolioProps {
  id?: number;
  clientId: number;
  portfolioId: number;
  portfolioName?: string | null;
  registeredAt: Date;
}

/** CLIENTE_PORTAFOLIO: a product line the client is interested in (HU-16). */
export class ClientPortfolio {
  readonly id?: number;
  readonly clientId: number;
  readonly portfolioId: number;
  readonly portfolioName: string | null;
  readonly registeredAt: Date;

  constructor(props: ClientPortfolioProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.portfolioId = props.portfolioId;
    this.portfolioName = props.portfolioName ?? null;
    this.registeredAt = props.registeredAt;
  }
}
