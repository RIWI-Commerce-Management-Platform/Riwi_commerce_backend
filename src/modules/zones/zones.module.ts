import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneRepository } from './domain/zone.repository.js';
import { CreateZoneUseCase } from './application/create-zone.use-case.js';
import { ListZonesUseCase } from './application/list-zones.use-case.js';
import { ZoneOrmEntity } from './infrastructure/zone.orm-entity.js';
import { TypeOrmZoneRepository } from './infrastructure/typeorm-zone.repository.js';
import { ZonesController } from './presentation/zones.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ZoneOrmEntity])],
  controllers: [ZonesController],
  providers: [
    CreateZoneUseCase,
    ListZonesUseCase,
    { provide: ZoneRepository, useClass: TypeOrmZoneRepository },
  ],
})
export class ZonesModule {}
