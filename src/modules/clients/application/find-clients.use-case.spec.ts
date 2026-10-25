import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientFilterCriteria } from '../domain/client-filter.criteria.js';
import { FindClientsUseCase } from './find-clients.use-case.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

describe('FindClientsUseCase', () => {
  const save = vi.fn();
  const findById = vi.fn();
  const findByNit = vi.fn();
  const findPaginated = vi.fn();

  const mockDao: ClientDao = {
    save,
    findById,
    findByNit,
    findPaginated,
  };

  it('should call clientDao.findPaginated and return result', async () => {
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

    const expectedResult: PaginatedResult<Client> = {
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

    findPaginated.mockResolvedValueOnce(expectedResult);

    const useCase = new FindClientsUseCase(mockDao);
    const criteria: ClientFilterCriteria = {
      search: 'Andes',
      zoneId: 10,
      page: 1,
      limit: 10,
    };

    const result = await useCase.execute(criteria);

    expect(findPaginated).toHaveBeenCalledWith(criteria);
    expect(result).toEqual(expectedResult);
  });
});

describe('FindClientsUseCase role scope', () => {
  it('limits a regional director to their zone', async () => {
    const findPaginated = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const useCase = new FindClientsUseCase({
      findPaginated,
    } as unknown as ClientDao);

    await useCase.execute(
      { page: 1, limit: 10, zoneId: 99 },
      {
        id: 2,
        role: UserRole.DIRECTOR_REGIONAL,
        zoneId: 4,
      },
    );

    expect(findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      zoneId: 4,
    });
  });
});
