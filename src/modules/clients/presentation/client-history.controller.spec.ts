import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ClientHistoryController } from './client-history.controller.js';
import { RecordClientActivityUseCase } from '../application/record-client-activity.use-case.js';
import { GetClientHistoryUseCase } from '../application/get-client-history.use-case.js';
import { GetRecentInteractionsUseCase } from '../application/get-recent-interactions.use-case.js';
import { ClientHistory } from '../domain/client-history.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { FindClientHistoryQueryDto } from './dto/find-client-history-query.dto.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

describe('ClientHistoryController', () => {
  const mockHistory = new ClientHistory({
    id: 1,
    clientId: 10,
    action: 'visit.started',
    description: 'Visit #1 started by advisor',
    userId: 'usr-1',
    createdAt: new Date('2026-10-22T08:00:00Z'),
  });

  const setup = () => {
    const recordExecute = vi.fn();
    const getHistoryExecute = vi.fn();
    const getRecentExecute = vi.fn();

    const recordUseCase = {
      execute: recordExecute,
    } as unknown as RecordClientActivityUseCase;

    const getHistoryUseCase = {
      execute: getHistoryExecute,
    } as unknown as GetClientHistoryUseCase;

    const getRecentUseCase = {
      execute: getRecentExecute,
    } as unknown as GetRecentInteractionsUseCase;

    const controller = new ClientHistoryController(
      recordUseCase,
      getHistoryUseCase,
      getRecentUseCase,
    );

    return {
      controller,
      recordExecute,
      getHistoryExecute,
      getRecentExecute,
    };
  };

  describe('getRecentInteractions', () => {
    it('should return recent interactions mapped to DTOs', async () => {
      const { controller, getRecentExecute } = setup();
      getRecentExecute.mockResolvedValueOnce([mockHistory]);

      const result = await controller.getRecentInteractions('10');

      expect(getRecentExecute).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].action).toBe('visit.started');
    });

    it('should use default limit of 10 when limit is not provided or invalid', async () => {
      const { controller, getRecentExecute } = setup();
      getRecentExecute.mockResolvedValueOnce([]);

      await controller.getRecentInteractions(undefined);

      expect(getRecentExecute).toHaveBeenCalledWith(10);
    });
  });

  describe('getClientHistory', () => {
    it('should return paginated history for client', async () => {
      const { controller, getHistoryExecute } = setup();
      const paginatedResult: PaginatedResult<ClientHistory> = {
        data: [mockHistory],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      getHistoryExecute.mockResolvedValueOnce(paginatedResult);

      const query = new FindClientHistoryQueryDto();
      query.page = 1;
      query.limit = 10;

      const result = await controller.getClientHistory(10, query);

      expect(getHistoryExecute).toHaveBeenCalledWith(10, expect.any(Object));
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].id).toBe(1);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      const { controller, getHistoryExecute } = setup();
      getHistoryExecute.mockRejectedValueOnce(new ClientNotFoundError(99));

      const query = new FindClientHistoryQueryDto();

      await expect(controller.getClientHistory(99, query)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordActivity', () => {
    it('should record an activity and return DTO', async () => {
      const { controller, recordExecute } = setup();
      recordExecute.mockResolvedValueOnce(mockHistory);

      const result = await controller.recordActivity(
        10,
        {
          action: 'note.added',
          description: 'Customer requested a callback',
          userId: 'spoofed-user',
        } as any,
        'authenticated-user',
      );

      expect(recordExecute).toHaveBeenCalledWith({
        clientId: 10,
        action: 'note.added',
        description: 'Customer requested a callback',
        userId: 'authenticated-user',
        metadata: undefined,
      });
      expect(result.id).toBe(1);
      expect(result.action).toBe('visit.started');
    });

    it('should throw NotFoundException when client does not exist', async () => {
      const { controller, recordExecute } = setup();
      recordExecute.mockRejectedValueOnce(new ClientNotFoundError(404));

      await expect(
        controller.recordActivity(
          404,
          {
            action: 'note.added',
            description: 'Note',
          },
          'authenticated-user',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
