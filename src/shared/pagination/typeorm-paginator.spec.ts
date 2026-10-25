import { describe, expect, it, vi } from 'vitest';
import type { SelectQueryBuilder } from 'typeorm';
import { applyCommercialFilters, paginateQuery } from './typeorm-paginator.js';

describe('TypeOrmPaginator (Shared)', () => {
  describe('applyCommercialFilters', () => {
    it('applies all commercial filters when present', () => {
      const qbMock: Partial<SelectQueryBuilder<any>> = {
        andWhere: vi.fn().mockReturnThis(),
      };

      applyCommercialFilters(qbMock as SelectQueryBuilder<any>, 'order', {
        clientId: 42,
        status: 'APPROVED',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'order.clientId = :clientId',
        {
          clientId: 42,
        },
      );
      expect(qbMock.andWhere).toHaveBeenCalledWith('order.status = :status', {
        status: 'APPROVED',
      });
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'order.createdAt >= :startDate',
        expect.objectContaining({ startDate: expect.any(Date) }),
      );
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'order.createdAt <= :endDate',
        expect.objectContaining({ endDate: expect.any(Date) }),
      );
    });

    it('does not apply filters when properties are undefined', () => {
      const qbMock: Partial<SelectQueryBuilder<any>> = {
        andWhere: vi.fn().mockReturnThis(),
      };

      applyCommercialFilters(qbMock as SelectQueryBuilder<any>, 'quote', {});

      expect(qbMock.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('paginateQuery', () => {
    it('paginates query results with defaults', async () => {
      const qbMock: Partial<SelectQueryBuilder<any>> = {
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[{ id: 1 }], 1]),
      };

      const result = await paginateQuery({
        query: qbMock as SelectQueryBuilder<any>,
        transform: (e) => ({ transformedId: e.id }),
      });

      expect(qbMock.skip).toHaveBeenCalledWith(0);
      expect(qbMock.take).toHaveBeenCalledWith(10);
      expect(result.data).toEqual([{ transformedId: 1 }]);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('handles negative or invalid page and limit values', async () => {
      const qbMock: Partial<SelectQueryBuilder<any>> = {
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
      };

      const result = await paginateQuery({
        query: qbMock as SelectQueryBuilder<any>,
        page: -5,
        limit: 0,
        transform: (e) => e,
      });

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('handles pagination beyond first page with max limit capping', async () => {
      const qbMock: Partial<SelectQueryBuilder<any>> = {
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[{ id: 10 }], 50]),
      };

      const result = await paginateQuery({
        query: qbMock as SelectQueryBuilder<any>,
        page: 2,
        limit: 200,
        transform: (e) => e,
      });

      expect(qbMock.skip).toHaveBeenCalledWith(100);
      expect(qbMock.take).toHaveBeenCalledWith(100);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(100);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasPreviousPage).toBe(true);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });
});
