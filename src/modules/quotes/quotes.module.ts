import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRepository } from './domain/quote.repository.js';
import { CreateQuoteUseCase } from './application/create-quote.use-case.js';
import { GetQuoteByIdUseCase } from './application/get-quote-by-id.use-case.js';
import { QuoteOrmEntity } from './infrastructure/quote.orm-entity.js';
import { QuoteItemOrmEntity } from './infrastructure/quote-item.orm-entity.js';
import { TypeOrmQuoteRepository } from './infrastructure/typeorm-quote.repository.js';
import { QuotesController } from './presentation/quotes.controller.js';
import { ClientsModule } from '../../shared/clients/clients.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteOrmEntity, QuoteItemOrmEntity]),
    ClientsModule,
  ],
  controllers: [QuotesController],
  providers: [
    CreateQuoteUseCase,
    GetQuoteByIdUseCase,
    { provide: QuoteRepository, useClass: TypeOrmQuoteRepository },
  ],
  exports: [QuoteRepository, CreateQuoteUseCase],
})
export class QuotesModule {}
