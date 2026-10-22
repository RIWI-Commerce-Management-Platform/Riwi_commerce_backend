import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRepository } from './domain/quote.repository.js';
import { CreateQuoteUseCase } from './application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from './application/get-quote-by-id.use-case.js';
import { AttachQuoteDocumentUseCase } from './application/attach-quote-document.use-case.js';
import { ChangeQuoteStatusUseCase } from './application/change-quote-status.use-case.js';
import { QuoteOrmEntity } from './infrastructure/quote.orm-entity.js';
import { QuoteItemOrmEntity } from './infrastructure/quote-item.orm-entity.js';
import { TypeOrmQuoteRepository } from './infrastructure/typeorm-quote.repository.js';
import { QuotesController } from './presentation/quotes.controller.js';
import { ClientsModule } from '../../shared/clients/clients.module.js';
import { FileStorageModule } from '../../shared/file-storage/file-storage.module.js';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module.js';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteOrmEntity, QuoteItemOrmEntity]),
    ClientsModule,
    FileStorageModule,
    ActivityLogModule,
    SharedAuthModule,
  ],
  controllers: [QuotesController],
  providers: [
    CreateQuoteUseCase,
    GetQuoteByIdUseCase,
    AttachQuoteDocumentUseCase,
    ChangeQuoteStatusUseCase,
    { provide: QuoteRepository, useClass: TypeOrmQuoteRepository },
  ],
  exports: [
    QuoteRepository,
    CreateQuoteUseCase,
    GetQuoteByIdUseCase,
    AttachQuoteDocumentUseCase,
    ChangeQuoteStatusUseCase,
  ],
})
export class QuotesModule {}
