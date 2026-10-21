import { Injectable } from '@nestjs/common';
import { AllCatalogs, CatalogRepository } from '../domain/catalog.repository.js';

@Injectable()
export class ListCatalogsUseCase {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async execute(): Promise<AllCatalogs> {
    return this.catalogRepository.findAll();
  }
}
