import { Module } from '@nestjs/common';

import { ClientReader } from './domain/client-reader.js';
import { TypeOrmClientReader } from './infrastructure/typeorm-client.reader.js';
import { ClientsModule as RealClientsModule } from '../../modules/clients/clients.module.js';
import { CatalogsModule } from '../../modules/catalogs/catalogs.module.js';

@Module({
  imports: [RealClientsModule, CatalogsModule],
  providers: [
    {
      provide: ClientReader,
      useClass: TypeOrmClientReader,
    },
  ],
  exports: [ClientReader],
})
export class ClientsModule {}
