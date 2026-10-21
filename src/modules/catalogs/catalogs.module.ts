import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogRepository } from './domain/catalog.repository.js';
import { ListCatalogsUseCase } from './application/list-catalogs.use-case.js';
import { ListCatalogByTypeUseCase } from './application/list-catalog-by-type.use-case.js';
import { CreateCatalogItemUseCase } from './application/create-catalog-item.use-case.js';
import { UpdateCatalogItemUseCase } from './application/update-catalog-item.use-case.js';
import { SeedCatalogsUseCase } from './application/seed-catalogs.use-case.js';
import { ClientTypeOrmEntity } from './infrastructure/client-type.orm-entity.js';
import { PotentialOrmEntity } from './infrastructure/potential.orm-entity.js';
import { ClientStatusOrmEntity } from './infrastructure/client-status.orm-entity.js';
import { PortfolioOrmEntity } from './infrastructure/portfolio.orm-entity.js';
import { VisitResultOrmEntity } from './infrastructure/visit-result.orm-entity.js';
import { ZoneOrmEntity } from '../zones/infrastructure/zone.orm-entity.js';
import { TypeOrmCatalogRepository } from './infrastructure/typeorm-catalog.repository.js';
import { CatalogsSeedService } from './infrastructure/catalogs-seed.service.js';
import { CatalogsController } from './presentation/catalogs.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientTypeOrmEntity,
      PotentialOrmEntity,
      ClientStatusOrmEntity,
      PortfolioOrmEntity,
      VisitResultOrmEntity,
      ZoneOrmEntity,
    ]),
  ],
  controllers: [CatalogsController],
  providers: [
    ListCatalogsUseCase,
    ListCatalogByTypeUseCase,
    CreateCatalogItemUseCase,
    UpdateCatalogItemUseCase,
    SeedCatalogsUseCase,
    CatalogsSeedService,
    {
      provide: CatalogRepository,
      useClass: TypeOrmCatalogRepository,
    },
  ],
  exports: [CatalogRepository, SeedCatalogsUseCase],
})
export class CatalogsModule {}
