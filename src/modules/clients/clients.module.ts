import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientRepository } from './domain/client.repository.js';
import { GeocodingPort } from './application/ports/geocoding.port.js';
import { CreateClientUseCase } from './application/create-client.use-case.js';
import { UpdateClientUseCase } from './application/update-client.use-case.js';
import { ToggleClientStatusUseCase } from './application/toggle-client-status.use-case.js';
import { FindClientsUseCase } from './application/find-clients.use-case.js';
import { GetClientByIdUseCase } from './application/get-client-by-id.use-case.js';
import { ClientOrmEntity } from './infrastructure/client.orm-entity.js';
import { TypeOrmClientRepository } from './infrastructure/typeorm-client.repository.js';
import { NominatimGeocodingAdapter } from './infrastructure/adapters/nominatim-geocoding.adapter.js';
import { ClientsController } from './presentation/clients.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ClientOrmEntity])],
  controllers: [ClientsController],
  providers: [
    CreateClientUseCase,
    UpdateClientUseCase,
    ToggleClientStatusUseCase,
    FindClientsUseCase,
    GetClientByIdUseCase,
    {
      provide: ClientRepository,
      useClass: TypeOrmClientRepository,
    },
    {
      provide: GeocodingPort,
      useClass: NominatimGeocodingAdapter,
    },
  ],
  exports: [ClientRepository],
})
export class ClientsModule {}
