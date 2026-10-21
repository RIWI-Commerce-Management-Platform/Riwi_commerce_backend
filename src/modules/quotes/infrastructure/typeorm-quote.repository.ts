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

  async findById(id: string): Promise<Quote | null> {
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
    const [latest] = await this.ormRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (!latest?.quoteNumber) {
      return 'COT-0001';
    }

    const matches = latest.quoteNumber.match(/COT-(\d+)/);
    if (!matches || !matches[1]) {
      const count = await this.ormRepository.count();
      return `COT-${String(count + 1).padStart(4, '0')}`;
    }

    const nextSequential = Number.parseInt(matches[1], 10) + 1;
    return `COT-${String(nextSequential).padStart(4, '0')}`;
  }
}
