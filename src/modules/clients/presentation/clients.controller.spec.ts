import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientNitAlreadyExistsError } from '../domain/client-nit-already-exists.error.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { CreateClientUseCase } from '../application/create-client.use-case.js';
import { UpdateClientUseCase } from '../application/update-client.use-case.js';
import { ToggleClientStatusUseCase } from '../application/toggle-client-status.use-case.js';
import { FindClientsUseCase } from '../application/find-clients.use-case.js';
import { GetClientByIdUseCase } from '../application/get-client-by-id.use-case.js';
import { ClientsController } from './clients.controller.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { FindClientsQueryDto } from './dto/find-clients-query.dto.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

describe('ClientsController', () => {
  const dummyClient = new Client({
    id: 1,
    nit: '900123456-1',
    businessName: 'Distribuidora Los Andes S.A.S.',
    commercialName: 'Los Andes Market',
    address: 'Calle 50 # 45-20',
    department: 'Antioquia',
    municipality: 'Medellín',
    neighborhood: 'Laureles',
    phone: '+573001234567',
    email: 'contacto@losandes.com',
    zoneId: 10,
    clientTypeId: 20,
    potentialId: 30,
    clientStatusId: 40,
    visitFrequencyDays: 15,
    latitude: 6.2442,
    longitude: -75.5812,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createExecute = vi.fn();
  const mockCreateUseCase = {
    execute: createExecute,
  } as unknown as CreateClientUseCase;

  const updateExecute = vi.fn();
  const mockUpdateUseCase = {
    execute: updateExecute,
  } as unknown as UpdateClientUseCase;

  const toggleStatusExecute = vi.fn();
  const mockToggleStatusUseCase = {
    execute: toggleStatusExecute,
  } as unknown as ToggleClientStatusUseCase;

  const findClientsExecute = vi.fn();
  const mockFindClientsUseCase = {
    execute: findClientsExecute,
  } as unknown as FindClientsUseCase;

  const getClientByIdExecute = vi.fn();
  const mockGetClientByIdUseCase = {
    execute: getClientByIdExecute,
  } as unknown as GetClientByIdUseCase;

  const listHistoryExecute = vi.fn();
  const listHistoryUseCase = { execute: listHistoryExecute };
  const adminActor = { id: 1, role: 'ADMIN', zoneId: null };
  const currentActor = { extract: vi.fn().mockResolvedValue(adminActor) };

  const controller = new ClientsController(
    mockCreateUseCase,
    mockUpdateUseCase,
    mockToggleStatusUseCase,
    mockFindClientsUseCase,
    mockGetClientByIdUseCase,
    listHistoryUseCase as any,
    currentActor as any,
  );

  describe('findClients', () => {
    it('should return paginated clients with coordinates and meta', async () => {
      const paginatedResult: PaginatedResult<Client> = {
        data: [dummyClient],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      findClientsExecute.mockResolvedValueOnce(paginatedResult);

      const query = new FindClientsQueryDto();
      query.search = 'Andes';
      query.page = '1';
      query.limit = '10';

      const response = await controller.findClients(query, {} as any);

      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe(1);
      expect(response.data[0].latitude).toBe(6.2442);
      expect(response.data[0].longitude).toBe(-75.5812);
      expect(response.meta.total).toBe(1);
      expect(findClientsExecute).toHaveBeenCalledWith(
        {
          search: 'Andes',
          zoneId: undefined,
          clientTypeId: undefined,
          potentialId: undefined,
          municipality: undefined,
          isActive: undefined,
          page: 1,
          limit: 10,
        },
        adminActor,
      );
    });
  });

  describe('getHistory', () => {
    it('returns the paginated activity log of the client', async () => {
      listHistoryExecute.mockResolvedValueOnce({
        data: [
          {
            id: 5,
            clientId: 1,
            userId: 3,
            userName: 'Ana',
            action: 'client.updated',
            entityType: 'client',
            entityId: '1',
            description: 'Client data updated',
            metadata: null,
            createdAt: new Date(),
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await controller.getHistory(
        1,
        new FindClientsQueryDto(),
      );

      expect(listHistoryExecute).toHaveBeenCalledWith({
        clientId: 1,
        page: 1,
        limit: 10,
      });
      expect(response.data[0].userName).toBe('Ana');
    });

    it('maps a missing client to 404', async () => {
      listHistoryExecute.mockRejectedValueOnce(new ClientNotFoundError(99));

      await expect(
        controller.getHistory(99, new FindClientsQueryDto()),
      ).rejects.toThrow(NotFoundException);
    });

    it('rethrows unexpected errors', async () => {
      const failure = new Error('database down');
      listHistoryExecute.mockRejectedValueOnce(failure);

      await expect(
        controller.getHistory(1, new FindClientsQueryDto()),
      ).rejects.toBe(failure);
    });
  });

  describe('getClientById', () => {
    it('should return client response with coordinates when found', async () => {
      getClientByIdExecute.mockResolvedValueOnce(dummyClient);

      const response = await controller.getClientById(1);

      expect(response.id).toBe(1);
      expect(response.latitude).toBe(6.2442);
      expect(response.longitude).toBe(-75.5812);
    });

    it('should translate ClientNotFoundError to NotFoundException', async () => {
      getClientByIdExecute.mockRejectedValueOnce(new ClientNotFoundError(999));

      await expect(controller.getClientById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto: CreateClientDto = {
      nit: '900123456-1',
      businessName: 'Distribuidora Los Andes S.A.S.',
      commercialName: 'Los Andes Market',
      address: 'Calle 50 # 45-20',
      department: 'Antioquia',
      municipality: 'Medellín',
      neighborhood: 'Laureles',
      phone: '+573001234567',
      email: 'contacto@losandes.com',
      zoneId: 10,
      clientTypeId: 20,
      potentialId: 30,
      clientStatusId: 40,
      visitFrequencyDays: 15,
    };

    it('should return ClientResponseDto on successful creation', async () => {
      createExecute.mockResolvedValueOnce(dummyClient);

      const response = await controller.create(dto);

      expect(response.id).toBe(1);
      expect(response.nit).toBe(dummyClient.nit);
    });

    it('should translate ClientNitAlreadyExistsError to ConflictException', async () => {
      createExecute.mockRejectedValueOnce(
        new ClientNitAlreadyExistsError('900123456-1'),
      );

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const dto: UpdateClientDto = {
      commercialName: 'Updated Name',
    };

    it('should return ClientResponseDto on successful update', async () => {
      updateExecute.mockResolvedValueOnce(dummyClient);

      const response = await controller.update(1, dto);

      expect(response.id).toBe(1);
    });

    it('should translate ClientNotFoundError to NotFoundException', async () => {
      updateExecute.mockRejectedValueOnce(new ClientNotFoundError(999));

      await expect(controller.update(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should translate ClientNitAlreadyExistsError to ConflictException', async () => {
      updateExecute.mockRejectedValueOnce(
        new ClientNitAlreadyExistsError('900999999-9'),
      );

      await expect(controller.update(1, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('toggleStatus', () => {
    it('should return ClientResponseDto on toggle', async () => {
      toggleStatusExecute.mockResolvedValueOnce(dummyClient);

      const response = await controller.toggleStatus(1, {
        isActive: false,
      });

      expect(response.id).toBe(1);
    });

    it('should translate ClientNotFoundError to NotFoundException', async () => {
      toggleStatusExecute.mockRejectedValueOnce(new ClientNotFoundError(999));

      await expect(
        controller.toggleStatus(999, { isActive: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rethrow unexpected errors', async () => {
      const err = new Error('Database connection failed');

      getClientByIdExecute.mockRejectedValueOnce(err);
      await expect(controller.getClientById(1)).rejects.toThrow(err);

      createExecute.mockRejectedValueOnce(err);
      await expect(controller.create({} as any)).rejects.toThrow(err);

      updateExecute.mockRejectedValueOnce(err);
      await expect(controller.update(1, {} as any)).rejects.toThrow(err);

      toggleStatusExecute.mockRejectedValueOnce(err);
      await expect(controller.toggleStatus(1)).rejects.toThrow(err);
    });
  });
});
