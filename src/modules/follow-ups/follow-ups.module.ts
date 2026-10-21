import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../shared/auth/auth.module.js';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module.js';
import { VisitsModule } from '../visit/visit.module.js';

import { FollowUpDao } from './domain/dao/follow-up.dao.js';
import { FollowUpOrmEntity } from './infrastructure/follow-up.orm-entity.js';
import { TypeOrmFollowUpDao } from './infrastructure/dao/typeorm-follow-up.dao.js';
import { CreateFollowUpUseCase } from './application/create-follow-up.use-case.js';
import { CompleteFollowUpUseCase } from './application/complete-follow-up.use-case.js';
import { ListFollowUpsUseCase } from './application/list-follow-ups.use-case.js';
import { FollowUpsController } from './presentation/follow-ups.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FollowUpOrmEntity]),
    AuthModule,
    ActivityLogModule,
    VisitsModule,
  ],
  controllers: [FollowUpsController],
  providers: [
    CreateFollowUpUseCase,
    CompleteFollowUpUseCase,
    ListFollowUpsUseCase,
    { provide: FollowUpDao, useClass: TypeOrmFollowUpDao },
  ],
  exports: [FollowUpDao],
})
export class FollowUpsModule {}
