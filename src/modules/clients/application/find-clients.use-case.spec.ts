import { describe, expect, it, vi } from 'vitest';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientFilterCriteria } from '../domain/client-filter.criteria.js';
import { FindClientsUseCase } from './find-clients.use-case.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

describe('FindClientsUseCase', () => {
  const save = vi.fn();
  const findById = vi.fn();
  const findByNit = vi.fn();
  const findPaginated = vi.fn();

  const mockRepository: ClientRepository = {
    save,
    findById,
    findByNit,
    findPaginated,
  };

  it('should call clientRepository.findPaginated and return result', async () => {
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

    const useCase = new FindClientsUseCase(mockRepository);
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
