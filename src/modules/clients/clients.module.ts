import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientRepository } from './domain/client.repository.js';
import { ClientContactRepository } from './domain/client-contact.repository.js';
import { ClientHistoryRepository } from './domain/client-history.repository.js';
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
import { RecordClientActivityUseCase } from './application/record-client-activity.use-case.js';
import { GetClientHistoryUseCase } from './application/get-client-history.use-case.js';
import { GetRecentInteractionsUseCase } from './application/get-recent-interactions.use-case.js';
import { ClientOrmEntity } from './infrastructure/client.orm-entity.js';
import { ClientContactOrmEntity } from './infrastructure/client-contact.orm-entity.js';
import { ClientHistoryOrmEntity } from './infrastructure/client-history.orm-entity.js';
import { TypeOrmClientRepository } from './infrastructure/typeorm-client.repository.js';
import { TypeOrmClientContactRepository } from './infrastructure/typeorm-client-contact.repository.js';
import { TypeOrmClientHistoryRepository } from './infrastructure/typeorm-client-history.repository.js';
import { NominatimGeocodingAdapter } from './infrastructure/adapters/nominatim-geocoding.adapter.js';
import { ClientsController } from './presentation/clients.controller.js';
import { ClientContactsController } from './presentation/client-contacts.controller.js';
import { ClientHistoryController } from './presentation/client-history.controller.js';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientOrmEntity,
      ClientContactOrmEntity,
      ClientHistoryOrmEntity,
    ]),
    ActivityLogModule,
  ],
  controllers: [
    ClientsController,
    ClientContactsController,
    ClientHistoryController,
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
    RecordClientActivityUseCase,
    GetClientHistoryUseCase,
    GetRecentInteractionsUseCase,
    {
      provide: ClientRepository,
      useClass: TypeOrmClientRepository,
    },
    {
      provide: ClientContactRepository,
      useClass: TypeOrmClientContactRepository,
    },
    {
      provide: ClientHistoryRepository,
      useClass: TypeOrmClientHistoryRepository,
    },
    {
      provide: GeocodingPort,
      useClass: NominatimGeocodingAdapter,
    },
  ],
  exports: [
    ClientRepository,
    ClientContactRepository,
    ClientHistoryRepository,
  ],
})
export class ClientsModule {}
