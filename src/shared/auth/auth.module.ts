import { Module } from '@nestjs/common';

import { CurrentAdvisorProvider } from './domain/current-advisor.provider.js';

import { HeaderCurrentAdvisorProvider } from './infrastructure/header-current-advisor.provider.js';

@Module({
  providers: [
    {
      provide: CurrentAdvisorProvider,
      useClass: HeaderCurrentAdvisorProvider,
    },
  ],
  exports: [CurrentAdvisorProvider],
})
export class AuthModule {}
