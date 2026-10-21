import { Quote } from '../domain/quote.entity.js';
import { QuoteItem } from '../domain/quote-item.entity.js';
import { QuoteStatus } from '../domain/quote-status.enum.js';
import { QuoteOrmEntity } from './quote.orm-entity.js';
import { QuoteItemOrmEntity } from './quote-item.orm-entity.js';

export class QuoteMapper {
  static toDomain(orm: QuoteOrmEntity): Quote {
    const items = (orm.items ?? []).map(
      (itemOrm) =>
        new QuoteItem({
          id: itemOrm.id,
          quoteId: itemOrm.quoteId,
          productName: itemOrm.productName,
          quantity: itemOrm.quantity,
          unitPrice: Number(itemOrm.unitPrice),
          subtotal: Number(itemOrm.subtotal),
        }),
    );

    return new Quote({
      id: orm.id,
      quoteNumber: orm.quoteNumber,
      clientId: orm.clientId,
      status: orm.status as QuoteStatus,
      subtotal: Number(orm.subtotal),
      total: Number(orm.total),
      notes: orm.notes,
      documentKey: orm.documentKey,
      items,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Quote): QuoteOrmEntity {
    const orm = new QuoteOrmEntity();
    if (domain.id !== undefined) {
      orm.id = domain.id;
    }
    orm.quoteNumber = domain.quoteNumber;
    orm.clientId = domain.clientId;
    orm.status = domain.status;
    orm.subtotal = domain.subtotal;
    orm.total = domain.total;
    orm.notes = domain.notes ?? null;
    orm.documentKey = domain.documentKey ?? null;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;

    orm.items = (domain.items ?? []).map((domainItem) => {
      const itemOrm = new QuoteItemOrmEntity();
      if (domainItem.id !== undefined) {
        itemOrm.id = domainItem.id;
      }
      // The quote's id isn't known yet for a new quote (DB-generated on
      // insert), so link via the relation and let TypeORM's cascade set
      // the quote_id FK once the parent row is inserted.
      itemOrm.quote = orm;
      itemOrm.productName = domainItem.productName;
      itemOrm.quantity = domainItem.quantity;
      itemOrm.unitPrice = domainItem.unitPrice;
      itemOrm.subtotal = domainItem.subtotal;
      return itemOrm;
    });

    return orm;
  }
}
