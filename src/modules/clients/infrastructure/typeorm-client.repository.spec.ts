import { describe, expect, it, vi } from 'vitest';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeOrmClientRepository } from './typeorm-client.repository.js';
import { ClientOrmEntity } from './client.orm-entity.js';
import { Client } from '../domain/client.entity.js';

describe('TypeOrmClientRepository', () => {
  const createMockOrmEntity = (): ClientOrmEntity => {
    const orm = new ClientOrmEntity();
    orm.id = 'c4e5f6a7-1234-4567-89ab-cdef01234567';
    orm.nit = '900123456-1';
    orm.businessName = 'Distribuidora Los Andes S.A.S.';
    orm.commercialName = 'Los Andes Market';
    orm.address = 'Calle 50 # 45-20';
    orm.department = 'Antioquia';
    orm.municipality = 'Medellín';
    orm.neighborhood = 'Laureles';
    orm.phone = '+573001234567';
    orm.email = 'contacto@losandes.com';
    orm.zoneId = 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb';
    orm.clientTypeId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    orm.potentialId = 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f';
    orm.clientStatusId = 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a';
    orm.visitFrequencyDays = 15;
    orm.latitude = 6.2442;
    orm.longitude = -75.5812;
    orm.isActive = true;
    orm.createdAt = new Date('2026-01-01');
    orm.updatedAt = new Date('2026-01-01');
    return orm;
  };

  it('findById should return domain client when found', async () => {
    const orm = createMockOrmEntity();
    const findOneBy = vi.fn().mockResolvedValueOnce(orm);
    const mockRepo = { findOneBy } as unknown as Repository<ClientOrmEntity>;

    const repo = new TypeOrmClientRepository(mockRepo);
    const result = await repo.findById(orm.id);

    expect(findOneBy).toHaveBeenCalledWith({ id: orm.id });
    expect(result?.id).toBe(orm.id);
    expect(result?.latitude).toBe(6.2442);
  });

  it('findById should return null when not found', async () => {
    const findOneBy = vi.fn().mockResolvedValueOnce(null);
    const mockRepo = { findOneBy } as unknown as Repository<ClientOrmEntity>;

    const repo = new TypeOrmClientRepository(mockRepo);
    const result = await repo.findById('non-existent');

    expect(result).toBeNull();
  });

  it('findByNit should return domain client when found', async () => {
    const orm = createMockOrmEntity();
    const findOneBy = vi.fn().mockResolvedValueOnce(orm);
    const mockRepo = { findOneBy } as unknown as Repository<ClientOrmEntity>;

    const repo = new TypeOrmClientRepository(mockRepo);
    const result = await repo.findByNit('900123456-1');

    expect(findOneBy).toHaveBeenCalledWith({ nit: '900123456-1' });
    expect(result?.nit).toBe('900123456-1');
  });

  it('save should persist and return domain client', async () => {
    const orm = createMockOrmEntity();
    const save = vi.fn().mockResolvedValueOnce(orm);
    const mockRepo = { save } as unknown as Repository<ClientOrmEntity>;

    const repo = new TypeOrmClientRepository(mockRepo);
    const domain = new Client({
      id: orm.id,
      nit: orm.nit,
      businessName: orm.businessName,
      commercialName: orm.commercialName,
      address: orm.address,
      department: orm.department,
      municipality: orm.municipality,
      neighborhood: orm.neighborhood,
      phone: orm.phone,
      email: orm.email,
      zoneId: orm.zoneId,
      clientTypeId: orm.clientTypeId,
      potentialId: orm.potentialId,
      clientStatusId: orm.clientStatusId,
      visitFrequencyDays: orm.visitFrequencyDays,
      latitude: orm.latitude,
      longitude: orm.longitude,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });

    const result = await repo.save(domain);

    expect(save).toHaveBeenCalled();
    expect(result.id).toBe(domain.id);
  });

  it('findPaginated should apply filters and return paginated domain clients', async () => {
    const orm = createMockOrmEntity();
    const andWhere = vi.fn().mockReturnThis();
    const orderBy = vi.fn().mockReturnThis();
    const skip = vi.fn().mockReturnThis();
    const take = vi.fn().mockReturnThis();
    const getManyAndCount = vi.fn().mockResolvedValueOnce([[orm], 1]);

    const qb = {
      andWhere,
      orderBy,
      skip,
      take,
      getManyAndCount,
    } as unknown as SelectQueryBuilder<ClientOrmEntity>;

    const createQueryBuilder = vi.fn().mockReturnValue(qb);
    const mockRepo = {
      createQueryBuilder,
    } as unknown as Repository<ClientOrmEntity>;

    const repo = new TypeOrmClientRepository(mockRepo);
    const result = await repo.findPaginated({
      search: 'Andes',
      zoneId: 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb',
      clientTypeId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      potentialId: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
      municipality: 'Medellín',
      isActive: true,
      page: 1,
      limit: 10,
    });

    expect(createQueryBuilder).toHaveBeenCalledWith('client');
    expect(andWhere).toHaveBeenCalledWith(
      '(LOWER(client.nit) LIKE :search OR LOWER(client.business_name) LIKE :search OR LOWER(client.commercial_name) LIKE :search)',
      { search: '%andes%' },
    );
    expect(andWhere).toHaveBeenCalledWith('client.zone_id = :zoneId', {
      zoneId: 'b6f6f96e-5264-4b53-9a3b-2fefbbbbbbbb',
    });
    expect(andWhere).toHaveBeenCalledWith('client.is_active = :isActive', {
      isActive: true,
    });
    expect(skip).toHaveBeenCalledWith(0);
    expect(take).toHaveBeenCalledWith(10);
    expect(orderBy).toHaveBeenCalledWith('client.created_at', 'DESC');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(orm.id);
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});

