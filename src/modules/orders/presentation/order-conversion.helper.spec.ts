import { describe, expect, it, vi } from 'vitest';
import { executeQuoteConversion } from './order-conversion.helper.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuoteNotFoundError } from '../../quotes/domain/errors/quote-not-found.error.js';
import { QuoteNotApprovedForOrderError } from '../domain/errors/quote-not-approved-for-order.error.js';
import { QuoteAlreadyConvertedError } from '../domain/errors/quote-already-converted.error.js';
import { OrderStatus } from '../domain/order-status.enum.js';

describe('executeQuoteConversion', () => {
  const mockOrder = {
    id: 1,
    orderNumber: 'PED-0001',
    quoteId: 10,
    clientId: 20,
    advisorId: 5,
    status: OrderStatus.BORRADOR,
    total: 1000,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMocks = () => {
    const useCase = {
      execute: vi.fn().mockResolvedValue(mockOrder),
    };
    const currentAdvisor = {
      extract: vi.fn().mockResolvedValue(5),
    };
    const request = {} as any;
    return { useCase, currentAdvisor, request };
  };

  it('converts quote to order successfully with extracted advisor', async () => {
    const { useCase, currentAdvisor, request } = createMocks();
    const result = await executeQuoteConversion(
      10,
      request,
      useCase as any,
      currentAdvisor as any,
    );
    expect(result.id).toBe(1);
    expect(useCase.execute).toHaveBeenCalledWith({
      quoteId: 10,
      actorId: 5,
    });
  });

  it('falls back to default actorId if advisor extraction fails', async () => {
    const { useCase, currentAdvisor, request } = createMocks();
    currentAdvisor.extract.mockRejectedValue(new Error('fail'));

    const result = await executeQuoteConversion(
      10,
      request,
      useCase as any,
      currentAdvisor as any,
    );
    expect(result.id).toBe(1);
    expect(useCase.execute).toHaveBeenCalledWith({
      quoteId: 10,
      actorId: 1,
    });
  });

  it('throws NotFoundException on QuoteNotFoundError', async () => {
    const { useCase, currentAdvisor, request } = createMocks();
    useCase.execute.mockRejectedValue(new QuoteNotFoundError(10));

    await expect(
      executeQuoteConversion(
        10,
        request,
        useCase as any,
        currentAdvisor as any,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException on QuoteNotApprovedForOrderError or QuoteAlreadyConvertedError', async () => {
    const { useCase, currentAdvisor, request } = createMocks();
    useCase.execute.mockRejectedValueOnce(
      new QuoteNotApprovedForOrderError('BORRADOR'),
    );

    await expect(
      executeQuoteConversion(
        10,
        request,
        useCase as any,
        currentAdvisor as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    useCase.execute.mockRejectedValueOnce(
      new QuoteAlreadyConvertedError('PED-0001'),
    );

    await expect(
      executeQuoteConversion(
        10,
        request,
        useCase as any,
        currentAdvisor as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rethrows unexpected errors', async () => {
    const { useCase, currentAdvisor, request } = createMocks();
    useCase.execute.mockRejectedValueOnce(new Error('db crash'));

    await expect(
      executeQuoteConversion(
        10,
        request,
        useCase as any,
        currentAdvisor as any,
      ),
    ).rejects.toThrow('db crash');
  });
});
