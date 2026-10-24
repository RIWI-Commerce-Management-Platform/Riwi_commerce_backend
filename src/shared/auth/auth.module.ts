import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CurrentAdvisorProvider } from './domain/current-advisor.provider.js';
import { CurrentActorProvider } from './domain/current-actor.provider.js';

import { SessionCurrentAdvisorProvider } from './infrastructure/session-current-advisor.provider.js';
import { SessionCurrentActorProvider } from './infrastructure/session-current-actor.provider.js';
import { UserOrmEntity } from '../../modules/auth/infrastructure/user.orm-entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    {
      provide: CurrentAdvisorProvider,
      useClass: SessionCurrentAdvisorProvider,
    },
    {
      provide: CurrentActorProvider,
      useClass: SessionCurrentActorProvider,
    },
  ],
  exports: [CurrentAdvisorProvider, CurrentActorProvider],
})
export class AuthModule {}
