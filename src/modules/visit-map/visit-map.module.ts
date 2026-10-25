import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitMapDao } from './domain/dao/visit-map.dao.js';
import { TypeOrmVisitMapDao } from './infrastructure/dao/typeorm-visit-map.dao.js';
import { GetVisitMapUseCase } from './application/use-cases/get-visit-map.use-case.js';
import { VisitMapController } from './presentation/visit-map.controller.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    // Needed by RolesGuard
    TypeOrmModule.forFeature([UserOrmEntity]),
    SharedAuthModule,
  ],
  controllers: [VisitMapController],
  providers: [
    GetVisitMapUseCase,
    { provide: VisitMapDao, useClass: TypeOrmVisitMapDao },
  ],
})
export class VisitMapModule {}
