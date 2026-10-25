import { Injectable } from '@nestjs/common';
import { CatalogDao, CatalogSeedData } from '../domain/catalog.dao.js';

export const INITIAL_CATALOG_SEED: CatalogSeedData = {
  zones: [
    'Barranquilla Norte',
    'Barranquilla Sur',
    'Soledad',
    'Malambo',
    'Galapa',
  ],
  clientTypes: [
    'Mayorista',
    'Minorista',
    'Distribuidor',
    'Cadena / Supermercado',
    'Institucional',
  ],
  potentials: [
    { name: 'Alto', order: 1 },
    { name: 'Medio', order: 2 },
    { name: 'Bajo', order: 3 },
  ],
  clientStatuses: ['Activo', 'Inactivo', 'Prospecto', 'Suspendido'],
  portfolios: [
    {
      name: 'Abarrotes y Alimentos',
      description: 'Línea de alimentos no perecederos, granos y enlatados',
    },
    {
      name: 'Bebidas y Snacks',
      description: 'Refrescos, jugos, aguas, pasabocas y confitería',
    },
    {
      name: 'Cuidado Personal',
      description: 'Artículos de higiene, jabones, champús y cosméticos',
    },
    {
      name: 'Limpieza del Hogar',
      description: 'Detergentes, desinfectantes, blanqueadores y aseo',
    },
  ],
  visitResults: [
    'Venta Exitosa',
    'Cotización Solicitada',
    'Seguimiento Programado',
    'Cliente Ausente',
    'No Interesado',
    'Reprogramada',
  ],
};

@Injectable()
export class SeedCatalogsUseCase {
  constructor(private readonly catalogDao: CatalogDao) {}

  async execute(customData?: Partial<CatalogSeedData>): Promise<{
    seeded: boolean;
    counts: Record<string, number>;
  }> {
    const dataToSeed: CatalogSeedData = {
      zones: customData?.zones ?? INITIAL_CATALOG_SEED.zones,
      clientTypes: customData?.clientTypes ?? INITIAL_CATALOG_SEED.clientTypes,
      potentials: customData?.potentials ?? INITIAL_CATALOG_SEED.potentials,
      clientStatuses:
        customData?.clientStatuses ?? INITIAL_CATALOG_SEED.clientStatuses,
      portfolios: customData?.portfolios ?? INITIAL_CATALOG_SEED.portfolios,
      visitResults:
        customData?.visitResults ?? INITIAL_CATALOG_SEED.visitResults,
    };

    return this.catalogDao.seed(dataToSeed);
  }
}
