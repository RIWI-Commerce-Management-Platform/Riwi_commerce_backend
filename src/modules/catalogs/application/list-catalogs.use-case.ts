import { Injectable } from '@nestjs/common';
import { AllCatalogs, CatalogDao } from '../domain/catalog.dao.js';

@Injectable()
export class ListCatalogsUseCase {
  constructor(private readonly catalogDao: CatalogDao) {}

  async execute(): Promise<AllCatalogs> {
    return this.catalogDao.findAll();
  }
}
