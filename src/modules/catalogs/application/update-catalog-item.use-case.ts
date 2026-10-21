import { Injectable } from '@nestjs/common';
import { CatalogRepository } from '../domain/catalog.repository.js';
import {
  CatalogItemNotFoundError,
  InvalidCatalogTypeError,
} from '../domain/catalog-errors.js';

export interface UpdateCatalogItemInput {
  type: string;
  id: string;
  name?: string;
  order?: number;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class UpdateCatalogItemUseCase {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async execute(input: UpdateCatalogItemInput): Promise<unknown> {
    switch (input.type) {
      case 'client-types': {
        const item = await this.catalogRepository.findClientTypeById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        if (input.name !== undefined) item.updateName(input.name);
        if (input.isActive === false) item.deactivate();
        return this.catalogRepository.saveClientType(item);
      }
      case 'potentials': {
        const item = await this.catalogRepository.findPotentialById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        item.update(input.name, input.order);
        if (input.isActive === false) item.deactivate();
        return this.catalogRepository.savePotential(item);
      }
      case 'client-statuses': {
        const item = await this.catalogRepository.findClientStatusById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        if (input.name !== undefined) item.updateName(input.name);
        if (input.isActive === false) item.deactivate();
        return this.catalogRepository.saveClientStatus(item);
      }
      case 'portfolios': {
        const item = await this.catalogRepository.findPortfolioById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        item.update(input.name, input.description);
        if (input.isActive === false) item.deactivate();
        return this.catalogRepository.savePortfolio(item);
      }
      case 'visit-results': {
        const item = await this.catalogRepository.findVisitResultById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        if (input.name !== undefined) item.updateName(input.name);
        if (input.isActive === false) item.deactivate();
        return this.catalogRepository.saveVisitResult(item);
      }
      default:
        throw new InvalidCatalogTypeError(input.type);
    }
  }
}
