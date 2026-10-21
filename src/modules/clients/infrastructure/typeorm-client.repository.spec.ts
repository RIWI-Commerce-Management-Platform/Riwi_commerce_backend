import { describe, expect, it, vi } from 'vitest';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeOrmClientRepository } from './typeorm-client.repository.js';
import { ClientOrmEntity } from './client.orm-entity.js';
import { Client } from '../domain/client.entity.js';

describe('TypeOrmClientRepository', () => {
  const createMockOrmEntity = (): ClientOrmEntity => {
    const orm = new ClientOrmEntity();
    orm.id = 1;
    orm.nit = '900123456-1';
    orm.businessName = 'Distribuidora Los Andes S.A.S.';
    orm.commercialName = 'Los Andes Market';
    orm.address = 'Calle 50 # 45-20';
    orm.department = 'Antioquia';
    orm.municipality = 'Medellín';
    orm.neighborhood = 'Laureles';
    orm.phone = '+573001234567';
    orm.email = 'contacto@losandes.com';
    orm.zoneId = 10;
    orm.clientTypeId = 20;
    orm.potentialId = 30;
    orm.clientStatusId = 40;
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
    const result = await repo.findById(1);

    expect(findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(result?.id).toBe(1);
    expect(result?.latitude).toBe(6.2442);
  });

  it('findById should return null when not found', async () => {
    const findOneBy = vi.fn().mockResolvedValueOnce(null);
    const mockRepo = { findOneBy } as unknown as Repository<ClientOrmEntity>;

    const repo = new TypeOrmClientRepository(mockRepo);
    const result = await repo.findById(999);

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
      id: 1,
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
    expect(result.id).toBe(1);
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
      zoneId: 10,
      clientTypeId: 20,
      potentialId: 30,
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
      zoneId: 10,
    });
    expect(andWhere).toHaveBeenCalledWith('client.is_active = :isActive', {
      isActive: true,
    });
    expect(skip).toHaveBeenCalledWith(0);
    expect(take).toHaveBeenCalledWith(10);
    expect(orderBy).toHaveBeenCalledWith('client.created_at', 'DESC');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(1);
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
