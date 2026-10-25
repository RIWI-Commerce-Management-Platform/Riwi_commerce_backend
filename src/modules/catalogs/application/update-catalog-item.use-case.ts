import { Injectable } from '@nestjs/common';
import { CatalogDao } from '../domain/catalog.dao.js';
import {
  CatalogItemNotFoundError,
  InvalidCatalogTypeError,
} from '../domain/catalog-errors.js';

export interface UpdateCatalogItemInput {
  type: string;
  id: number;
  name?: string;
  order?: number;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class UpdateCatalogItemUseCase {
  constructor(private readonly catalogDao: CatalogDao) {}

  async execute(input: UpdateCatalogItemInput): Promise<unknown> {
    switch (input.type) {
      case 'client-types': {
        const item = await this.catalogDao.findClientTypeById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        if (input.name !== undefined) item.updateName(input.name);
        if (input.isActive === false) item.deactivate();
        return this.catalogDao.saveClientType(item);
      }
      case 'potentials': {
        const item = await this.catalogDao.findPotentialById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        item.update(input.name, input.order);
        if (input.isActive === false) item.deactivate();
        return this.catalogDao.savePotential(item);
      }
      case 'client-statuses': {
        const item = await this.catalogDao.findClientStatusById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        if (input.name !== undefined) item.updateName(input.name);
        if (input.isActive === false) item.deactivate();
        return this.catalogDao.saveClientStatus(item);
      }
      case 'portfolios': {
        const item = await this.catalogDao.findPortfolioById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        item.update(input.name, input.description);
        if (input.isActive === false) item.deactivate();
        return this.catalogDao.savePortfolio(item);
      }
      case 'visit-results': {
        const item = await this.catalogDao.findVisitResultById(input.id);
        if (!item) {
          throw new CatalogItemNotFoundError(input.type, input.id);
        }
        if (input.name !== undefined) item.updateName(input.name);
        if (input.isActive === false) item.deactivate();
        return this.catalogDao.saveVisitResult(item);
      }
      default:
        throw new InvalidCatalogTypeError(input.type);
    }
  }
}
