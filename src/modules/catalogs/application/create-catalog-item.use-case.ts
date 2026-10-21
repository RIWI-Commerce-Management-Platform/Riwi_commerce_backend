import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { CatalogRepository } from '../domain/catalog.repository.js';
import {
  ClientType,
  Potential,
  ClientStatus,
  Portfolio,
  VisitResult,
} from '../domain/catalog-item.entity.js';
import { InvalidCatalogTypeError } from '../domain/catalog-errors.js';

export interface CreateCatalogItemInput {
  type: string;
  name: string;
  order?: number;
  description?: string;
}

@Injectable()
export class CreateCatalogItemUseCase {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async execute(input: CreateCatalogItemInput): Promise<unknown> {
    const now = new Date();
    const id = randomUUID();

    switch (input.type) {
      case 'client-types': {
        const item = new ClientType({
          id,
          name: input.name,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        return this.catalogRepository.saveClientType(item);
      }
      case 'potentials': {
        const item = new Potential({
          id,
          name: input.name,
          order: input.order ?? 1,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        return this.catalogRepository.savePotential(item);
      }
      case 'client-statuses': {
        const item = new ClientStatus({
          id,
          name: input.name,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        return this.catalogRepository.saveClientStatus(item);
      }
      case 'portfolios': {
        const item = new Portfolio({
          id,
          name: input.name,
          description: input.description ?? '',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        return this.catalogRepository.savePortfolio(item);
      }
      case 'visit-results': {
        const item = new VisitResult({
          id,
          name: input.name,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        return this.catalogRepository.saveVisitResult(item);
      }
      default:
        throw new InvalidCatalogTypeError(input.type);
    }
  }
}
