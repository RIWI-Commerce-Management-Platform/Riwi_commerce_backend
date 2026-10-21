import { Module } from '@nestjs/common';

import { ClientReader } from './domain/client-reader.js';

import { NullClientReader } from './infrastructure/null-client.reader.js';

@Module({
  providers: [
    {
      provide: ClientReader,
      useClass: NullClientReader,
    },
  ],
  exports: [ClientReader],
})
export class ClientsModule {}
