import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneDao } from './domain/zone.dao.js';
import { CreateZoneUseCase } from './application/create-zone.use-case.js';
import { ListZonesUseCase } from './application/list-zones.use-case.js';
import { UpdateZoneUseCase } from './application/update-zone.use-case.js';
import { ZoneOrmEntity } from './infrastructure/zone.orm-entity.js';
import { TypeOrmZoneDao } from './infrastructure/typeorm-zone.dao.js';
import { ZonesController } from './presentation/zones.controller.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';

@Module({
  // UserOrmEntity is needed by RolesGuard on the admin-only endpoints
  imports: [TypeOrmModule.forFeature([ZoneOrmEntity, UserOrmEntity])],
  controllers: [ZonesController],
  providers: [
    CreateZoneUseCase,
    ListZonesUseCase,
    UpdateZoneUseCase,
    { provide: ZoneDao, useClass: TypeOrmZoneDao },
  ],
})
export class ZonesModule {}
