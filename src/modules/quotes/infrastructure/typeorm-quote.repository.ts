import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../domain/quote.entity.js';
import { QuoteRepository } from '../domain/quote.repository.js';
import { QuoteOrmEntity } from './quote.orm-entity.js';
import { QuoteMapper } from './quote.mapper.js';

@Injectable()
export class TypeOrmQuoteRepository implements QuoteRepository {
  constructor(
    @InjectRepository(QuoteOrmEntity)
    private readonly ormRepository: Repository<QuoteOrmEntity>,
  ) {}

  async save(quote: Quote): Promise<Quote> {
    const ormEntity = QuoteMapper.toOrm(quote);
    const saved = await this.ormRepository.save(ormEntity);
    return QuoteMapper.toDomain(saved);
  }

  async findById(id: number): Promise<Quote | null> {
    const found = await this.ormRepository.findOne({
      where: { id },
      relations: { items: true },
    });

    return found ? QuoteMapper.toDomain(found) : null;
  }

  async findByQuoteNumber(quoteNumber: string): Promise<Quote | null> {
    const found = await this.ormRepository.findOne({
      where: { quoteNumber },
      relations: { items: true },
    });

    return found ? QuoteMapper.toDomain(found) : null;
  }

  async generateNextQuoteNumber(): Promise<string> {
    // Reading the latest row and incrementing it in application code is
    // racy under concurrent requests (two callers can read the same
    // "latest" before either commits). A Postgres sequence hands out a
    // unique value per call atomically, with no locking needed.
    const [{ nextval }] = await this.ormRepository.query<
      { nextval: string }[]
    >("SELECT nextval('quote_number_seq') AS nextval");

    return `COT-${nextval.padStart(4, '0')}`;
  }
}
