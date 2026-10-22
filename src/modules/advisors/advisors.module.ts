import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { AdvisorService } from './application/advisor.service.js';
import { AdvisorOrmEntity } from './infrastructure/advisor.orm-entity.js';
import { AdvisorsController } from './presentation/advisors.controller.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([AdvisorOrmEntity, UserOrmEntity]),
  ],
  controllers: [AdvisorsController],
  providers: [AdvisorService],
  exports: [AdvisorService, TypeOrmModule],
})
export class AdvisorsModule {}
