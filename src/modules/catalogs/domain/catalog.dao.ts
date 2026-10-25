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

export abstract class CatalogDao {
  abstract findAll(): Promise<AllCatalogs>;

  abstract findClientTypes(): Promise<ClientType[]>;
  abstract findClientTypeById(id: number): Promise<ClientType | null>;
  abstract saveClientType(item: ClientType): Promise<ClientType>;

  abstract findPotentials(): Promise<Potential[]>;
  abstract findPotentialById(id: number): Promise<Potential | null>;
  abstract savePotential(item: Potential): Promise<Potential>;

  abstract findClientStatuses(): Promise<ClientStatus[]>;
  abstract findClientStatusById(id: number): Promise<ClientStatus | null>;
  abstract saveClientStatus(item: ClientStatus): Promise<ClientStatus>;

  abstract findPortfolios(): Promise<Portfolio[]>;
  abstract findPortfolioById(id: number): Promise<Portfolio | null>;
  abstract savePortfolio(item: Portfolio): Promise<Portfolio>;

  abstract findVisitResults(): Promise<VisitResult[]>;
  abstract findVisitResultById(id: number): Promise<VisitResult | null>;
  abstract saveVisitResult(item: VisitResult): Promise<VisitResult>;

  abstract seed(seedData: CatalogSeedData): Promise<{
    seeded: boolean;
    counts: Record<string, number>;
  }>;
}
