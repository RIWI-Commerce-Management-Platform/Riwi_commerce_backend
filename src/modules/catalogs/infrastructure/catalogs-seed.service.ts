import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SeedCatalogsUseCase } from '../application/seed-catalogs.use-case.js';

@Injectable()
export class CatalogsSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogsSeedService.name);

  constructor(private readonly seedCatalogsUseCase: SeedCatalogsUseCase) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.logger.log('Verifying initial catalogs seed...');
      const result = await this.seedCatalogsUseCase.execute();
      this.logger.log(
        `Catalogs seed verified successfully. Record counts: ${JSON.stringify(
          result.counts,
        )}`,
      );
    } catch (error) {
      this.logger.error('Failed to run initial catalogs seed:', error);
    }
  }
}
