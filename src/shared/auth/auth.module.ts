import { Module } from '@nestjs/common';

import { CurrentAdvisorProvider } from './domain/current-advisor.provider.js';

import { SessionCurrentAdvisorProvider } from './infrastructure/session-current-advisor.provider.js';

@Module({
  providers: [
    {
      provide: CurrentAdvisorProvider,
      useClass: SessionCurrentAdvisorProvider,
    },
  ],
  exports: [CurrentAdvisorProvider],
})
export class AuthModule {}
