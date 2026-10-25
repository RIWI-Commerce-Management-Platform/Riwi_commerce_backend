import { Injectable } from '@nestjs/common';
import { CatalogDao } from '../domain/catalog.dao.js';
import { InvalidCatalogTypeError } from '../domain/catalog-errors.js';

@Injectable()
export class ListCatalogByTypeUseCase {
  constructor(private readonly catalogDao: CatalogDao) {}

  async execute(type: string): Promise<unknown[]> {
    switch (type) {
      case 'client-types':
        return this.catalogDao.findClientTypes();
      case 'potentials':
        return this.catalogDao.findPotentials();
      case 'client-statuses':
        return this.catalogDao.findClientStatuses();
      case 'portfolios':
        return this.catalogDao.findPortfolios();
      case 'visit-results':
        return this.catalogDao.findVisitResults();
      default:
        throw new InvalidCatalogTypeError(type);
    }
  }
}
