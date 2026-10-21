import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientRepository } from './domain/client.repository.js';
import { ClientContactRepository } from './domain/client-contact.repository.js';
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
import { TypeOrmClientRepository } from './infrastructure/typeorm-client.repository.js';
import { TypeOrmClientContactRepository } from './infrastructure/typeorm-client-contact.repository.js';
import { NominatimGeocodingAdapter } from './infrastructure/adapters/nominatim-geocoding.adapter.js';
import { ClientsController } from './presentation/clients.controller.js';
import { ClientContactsController } from './presentation/client-contacts.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientOrmEntity, ClientContactOrmEntity]),
  ],
  controllers: [ClientsController, ClientContactsController],
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
    {
      provide: ClientRepository,
      useClass: TypeOrmClientRepository,
    },
    {
      provide: ClientContactRepository,
      useClass: TypeOrmClientContactRepository,
    },
    {
      provide: GeocodingPort,
      useClass: NominatimGeocodingAdapter,
    },
  ],
  exports: [ClientRepository, ClientContactRepository],
})
export class ClientsModule {}
