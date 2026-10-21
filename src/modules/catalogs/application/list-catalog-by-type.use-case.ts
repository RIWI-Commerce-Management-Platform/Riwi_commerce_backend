import { Injectable } from '@nestjs/common';
import { CatalogRepository } from '../domain/catalog.repository.js';
import { InvalidCatalogTypeError } from '../domain/catalog-errors.js';

@Injectable()
export class ListCatalogByTypeUseCase {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async execute(type: string): Promise<unknown[]> {
    switch (type) {
      case 'client-types':
        return this.catalogRepository.findClientTypes();
      case 'potentials':
        return this.catalogRepository.findPotentials();
      case 'client-statuses':
        return this.catalogRepository.findClientStatuses();
      case 'portfolios':
        return this.catalogRepository.findPortfolios();
      case 'visit-results':
        return this.catalogRepository.findVisitResults();
      default:
        throw new InvalidCatalogTypeError(type);
    }
  }
}
