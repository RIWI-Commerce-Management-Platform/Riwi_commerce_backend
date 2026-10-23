import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateQuoteFromVisitDto } from './create-quote-from-visit.dto.js';

describe('CreateQuoteFromVisitDto', () => {
  it('accepts quote details without a client ID', async () => {
    const dto = plainToInstance(CreateQuoteFromVisitDto, {
      notes: 'Prepared during the client visit',
      items: [{ productName: 'Product', quantity: 2, unitPrice: 15.5 }],
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toHaveLength(0);
    expect(dto).not.toHaveProperty('clientId');
  });

  it('rejects an empty item list', async () => {
    const dto = plainToInstance(CreateQuoteFromVisitDto, { items: [] });

    const errors = await validate(dto, { whitelist: true });

    expect(errors.some((error) => error.property === 'items')).toBe(true);
  });

  it('rejects invalid item values', async () => {
    const dto = plainToInstance(CreateQuoteFromVisitDto, {
      items: [{ productName: 'Product', quantity: 0, unitPrice: -1 }],
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors.some((error) => error.property === 'items')).toBe(true);
  });
});
