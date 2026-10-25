import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndicatorsDao } from './domain/indicators.dao.js';
import { TypeOrmIndicatorsDao } from './infrastructure/typeorm-indicators.dao.js';
import { GetWeeklyGoalUseCase } from './application/get-weekly-goal.use-case.js';
import { GetIndicatorsUseCase } from './application/get-indicators.use-case.js';
import { IndicatorsController } from './presentation/indicators.controller.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    // Needed by RolesGuard
    TypeOrmModule.forFeature([UserOrmEntity]),
    SharedAuthModule,
  ],
  controllers: [IndicatorsController],
  providers: [
    GetWeeklyGoalUseCase,
    GetIndicatorsUseCase,
    { provide: IndicatorsDao, useClass: TypeOrmIndicatorsDao },
  ],
})
export class IndicatorsModule {}
