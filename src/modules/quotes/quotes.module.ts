import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteDao } from './domain/quote.dao.js';
import { CreateQuoteUseCase } from './application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from './application/get-quote-by-id.use-case.js';
import { AttachQuoteDocumentUseCase } from './application/attach-quote-document.use-case.js';
import { ChangeQuoteStatusUseCase } from './application/change-quote-status.use-case.js';
import { ListQuotesUseCase } from './application/list-quotes.use-case.js';
import { QuoteOrmEntity } from './infrastructure/quote.orm-entity.js';
import { QuoteItemOrmEntity } from './infrastructure/quote-item.orm-entity.js';
import { TypeOrmQuoteDao } from './infrastructure/typeorm-quote.dao.js';
import { QuotesController } from './presentation/quotes.controller.js';
import { ClientsModule } from '../../shared/clients/clients.module.js';
import { FileStorageModule } from '../../shared/file-storage/file-storage.module.js';
import { ActivityLogModule } from '../../shared/activity-log/activity-log.module.js';
import { AuthModule } from '../../shared/auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteOrmEntity, QuoteItemOrmEntity]),
    ClientsModule,
    FileStorageModule,
    ActivityLogModule,
    AuthModule,
  ],
  controllers: [QuotesController],
  providers: [
    CreateQuoteUseCase,
    GetQuoteByIdUseCase,
    AttachQuoteDocumentUseCase,
    ChangeQuoteStatusUseCase,
    ListQuotesUseCase,
    { provide: QuoteDao, useClass: TypeOrmQuoteDao },
  ],
  exports: [
    QuoteDao,
    CreateQuoteUseCase,
    GetQuoteByIdUseCase,
    AttachQuoteDocumentUseCase,
    ChangeQuoteStatusUseCase,
    ListQuotesUseCase,
  ],
})
export class QuotesModule {}
