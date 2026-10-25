import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientDao } from './domain/client.dao.js';
import { ClientContactDao } from './domain/client-contact.dao.js';
import { GeocodingPort } from './application/ports/geocoding.port.js';
import { CreateClientUseCase } from './application/create-client.use-case.js';
import { UpdateClientUseCase } from './application/update-client.use-case.js';
import { ToggleClientStatusUseCase } from './application/toggle-client-status.use-case.js';
import { FindClientsUseCase } from './application/find-clients.use-case.js';
import { GetClientByIdUseCase } from './application/get-client-by-id.use-case.js';
import { CreateClientContactUseCase } from './application/create-client-contact.use-case.js';
import { UpdateClientContactUseCase } from './application/update-client-contact.use-case.js';
import { ListClientContactsUseCase } from './application/list-client-contacts.use-case.js';
import { SetPrimaryContactUseCase } from './application/set-primary-contact.use-case.js';
import { DeleteClientContactUseCase } from './application/delete-client-contact.use-case.js';
import { ClientOrmEntity } from './infrastructure/client.orm-entity.js';
import { ClientContactOrmEntity } from './infrastructure/client-contact.orm-entity.js';
import { TypeOrmClientDao } from './infrastructure/typeorm-client.dao.js';
import { TypeOrmClientContactDao } from './infrastructure/typeorm-client-contact.dao.js';
import { NominatimGeocodingAdapter } from './infrastructure/adapters/nominatim-geocoding.adapter.js';
import { ClientsController } from './presentation/clients.controller.js';
import { ClientContactsController } from './presentation/client-contacts.controller.js';
import { ClientPortfoliosController } from './presentation/client-portfolios.controller.js';
import { ClientHistoryDao } from './domain/client-history.dao.js';
import { ClientPortfolioDao } from './domain/client-portfolio.dao.js';
import { ClientHistoryOrmEntity } from './infrastructure/client-history.orm-entity.js';
import { ClientPortfolioOrmEntity } from './infrastructure/client-portfolio.orm-entity.js';
import { TypeOrmClientHistoryDao } from './infrastructure/typeorm-client-history.dao.js';
import { TypeOrmClientPortfolioDao } from './infrastructure/typeorm-client-portfolio.dao.js';
import { ListClientHistoryUseCase } from './application/list-client-history.use-case.js';
import { ListClientPortfoliosUseCase } from './application/list-client-portfolios.use-case.js';
import { AddClientPortfolioUseCase } from './application/add-client-portfolio.use-case.js';
import { RemoveClientPortfolioUseCase } from './application/remove-client-portfolio.use-case.js';
import { PortfolioOrmEntity } from '../catalogs/infrastructure/portfolio.orm-entity.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module.js';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientOrmEntity,
      ClientContactOrmEntity,
      ClientHistoryOrmEntity,
      ClientPortfolioOrmEntity,
      PortfolioOrmEntity,
      UserOrmEntity,
    ]),
    ActivityLogModule,
    SharedAuthModule,
  ],
  controllers: [
    ClientsController,
    ClientContactsController,
    ClientPortfoliosController,
  ],
  providers: [
    CreateClientUseCase,
    UpdateClientUseCase,
    ToggleClientStatusUseCase,
    FindClientsUseCase,
    GetClientByIdUseCase,
    CreateClientContactUseCase,
    UpdateClientContactUseCase,
    ListClientContactsUseCase,
    SetPrimaryContactUseCase,
    DeleteClientContactUseCase,
    ListClientHistoryUseCase,
    ListClientPortfoliosUseCase,
    AddClientPortfolioUseCase,
    RemoveClientPortfolioUseCase,
    {
      provide: ClientHistoryDao,
      useClass: TypeOrmClientHistoryDao,
    },
    {
      provide: ClientPortfolioDao,
      useClass: TypeOrmClientPortfolioDao,
    },
    {
      provide: ClientDao,
      useClass: TypeOrmClientDao,
    },
    {
      provide: ClientContactDao,
      useClass: TypeOrmClientContactDao,
    },
    {
      provide: GeocodingPort,
      useClass: NominatimGeocodingAdapter,
    },
  ],
  exports: [ClientDao, ClientContactDao],
})
export class ClientsModule {}
