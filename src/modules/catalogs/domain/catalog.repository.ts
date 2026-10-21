import {
  ClientType,
  Potential,
  ClientStatus,
  Portfolio,
  VisitResult,
} from './catalog-item.entity.js';
import { Zone } from '../../zones/domain/zone.entity.js';

export interface AllCatalogs {
  zones: Zone[];
  clientTypes: ClientType[];
  potentials: Potential[];
  clientStatuses: ClientStatus[];
  portfolios: Portfolio[];
  visitResults: VisitResult[];
}

export interface CatalogSeedData {
  zones: string[];
  clientTypes: string[];
  potentials: { name: string; order: number }[];
  clientStatuses: string[];
  portfolios: { name: string; description: string }[];
  visitResults: string[];
}

export abstract class CatalogRepository {
  abstract findAll(): Promise<AllCatalogs>;

  abstract findClientTypes(): Promise<ClientType[]>;
  abstract findClientTypeById(id: string): Promise<ClientType | null>;
  abstract saveClientType(item: ClientType): Promise<ClientType>;

  abstract findPotentials(): Promise<Potential[]>;
  abstract findPotentialById(id: string): Promise<Potential | null>;
  abstract savePotential(item: Potential): Promise<Potential>;

  abstract findClientStatuses(): Promise<ClientStatus[]>;
  abstract findClientStatusById(id: string): Promise<ClientStatus | null>;
  abstract saveClientStatus(item: ClientStatus): Promise<ClientStatus>;

  abstract findPortfolios(): Promise<Portfolio[]>;
  abstract findPortfolioById(id: string): Promise<Portfolio | null>;
  abstract savePortfolio(item: Portfolio): Promise<Portfolio>;

  abstract findVisitResults(): Promise<VisitResult[]>;
  abstract findVisitResultById(id: string): Promise<VisitResult | null>;
  abstract saveVisitResult(item: VisitResult): Promise<VisitResult>;

  abstract seed(seedData: CatalogSeedData): Promise<{
    seeded: boolean;
    counts: Record<string, number>;
  }>;
}
