import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { UserOrmEntity } from '../../auth/infrastructure/user.orm-entity.js';
import { AdvisorOrmEntity } from '../infrastructure/advisor.orm-entity.js';
import { AdvisorService } from './advisor.service.js';

describe('AdvisorService', () => {
  const advisor = {
    idAsesor: 1,
    nombre: 'Ana Pérez',
    correo: 'ana@example.com',
    telefono: '+57 300 123 4567',
    estado: true,
    idUsuario: 'user-1',
  } as AdvisorOrmEntity;
  const advisorQuery = {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getOne: vi.fn().mockResolvedValue(null),
  };
  const advisorRepository = {
    create: vi.fn((data) => data),
    save: vi.fn(async (data) => data),
    find: vi.fn().mockResolvedValue([advisor]),
    findOneBy: vi.fn(async ({ idAsesor }: { idAsesor: number }) =>
      idAsesor === advisor.idAsesor ? advisor : null,
    ),
    createQueryBuilder: vi.fn(() => advisorQuery),
  };
  const userRepository = {
    findOneBy: vi.fn(async ({ id }: { id: string }) =>
      id === 'user-1'
        ? { id, role: UserRole.ASESOR, email: 'ana@example.com' }
        : null,
    ),
  };
  const service = new AdvisorService(
    advisorRepository as unknown as Repository<AdvisorOrmEntity>,
    userRepository as unknown as Repository<UserOrmEntity>,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    advisorQuery.getOne.mockResolvedValue(null);
    advisorRepository.findOneBy.mockImplementation(
      async ({ idAsesor }: { idAsesor: number }) =>
        idAsesor === advisor.idAsesor ? advisor : null,
    );
    userRepository.findOneBy.mockImplementation(
      async ({ id }: { id: string }) =>
        id === 'user-1'
          ? { id, role: UserRole.ASESOR, email: 'ana@example.com' }
          : null,
    );
  });

  it('creates an active advisor linked to an ASESOR user with normalized unique email', async () => {
    const created = await service.create({
      nombre: ' Ana Pérez ',
      correo: 'ANA@EXAMPLE.COM',
      telefono: ' +57 300 123 4567 ',
      idUsuario: 'user-1',
    });

    expect(created).toMatchObject({
      nombre: 'Ana Pérez',
      correo: 'ana@example.com',
      telefono: '+57 300 123 4567',
      idUsuario: 'user-1',
      estado: true,
    });
    expect(advisorRepository.save).toHaveBeenCalled();
  });

  it('rejects duplicate email and users already linked to another advisor', async () => {
    advisorQuery.getOne.mockResolvedValueOnce(advisor);
    await expect(
      service.create({
        nombre: 'Ana Pérez',
        correo: 'ana@example.com',
        telefono: '3001234567',
        idUsuario: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    advisorQuery.getOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(advisor);
    await expect(
      service.create({
        nombre: 'Ana Pérez',
        correo: 'new@example.com',
        telefono: '3001234567',
        idUsuario: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('only includes active advisors in the route-assignment list', async () => {
    await service.listAvailableForRoutes();
    expect(advisorRepository.find).toHaveBeenCalledWith({
      where: { estado: true },
      order: { nombre: 'ASC' },
    });
  });

  it('rejects inactive advisors for new route assignments', async () => {
    advisor.estado = false;
    await expect(
      service.getActiveForRouteAssignment(advisor.idAsesor),
    ).rejects.toBeInstanceOf(ConflictException);
    advisor.estado = true;
  });

  it('throws NotFoundException when getting active advisor that does not exist', async () => {
    await expect(
      service.getActiveForRouteAssignment(999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivates and reactivates via status updates without physical deletion', async () => {
    await service.deactivate(advisor.idAsesor);
    expect(advisor.estado).toBe(false);
    expect(advisorRepository.save).toHaveBeenCalledWith(advisor);
    expect(advisorRepository).not.toHaveProperty('delete');
    expect(advisorRepository).not.toHaveProperty('remove');

    await service.setStatus(advisor.idAsesor, true);
    expect(advisor.estado).toBe(true);
  });

  it('rejects unknown users and users without the ASESOR role', async () => {
    userRepository.findOneBy.mockResolvedValueOnce(null);
    await expect(
      service.create({
        nombre: 'Ana Pérez',
        correo: 'ana@example.com',
        telefono: '3001234567',
        idUsuario: 'missing-user',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    userRepository.findOneBy.mockResolvedValueOnce({
      id: 'user-1',
      role: UserRole.ADMINISTRADOR,
    });
    await expect(
      service.create({
        nombre: 'Ana Pérez',
        correo: 'ana@example.com',
        telefono: '3001234567',
        idUsuario: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists advisors including or excluding inactive', async () => {
    await service.list(true);
    expect(advisorRepository.find).toHaveBeenCalledWith({
      where: undefined,
      order: { idAsesor: 'ASC' },
    });

    await service.list(false);
    expect(advisorRepository.find).toHaveBeenCalledWith({
      where: { estado: true },
      order: { idAsesor: 'ASC' },
    });
  });

  it('gets advisor by id or throws NotFoundException', async () => {
    const found = await service.getById(1);
    expect(found).toBe(advisor);

    await expect(service.getById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates advisor fields successfully', async () => {
    const updated = await service.update(1, {
      nombre: 'Ana María Pérez',
      correo: 'ana@example.com',
      telefono: '3109876543',
    });
    expect(updated.nombre).toBe('Ana María Pérez');
    expect(advisorRepository.save).toHaveBeenCalled();
  });

  it('rethrows query failed error as ConflictException when duplicate constraint hits', async () => {
    const queryError1 = new QueryFailedError(
      'query',
      [],
      new Error('duplicate'),
    );
    (queryError1 as any).driverError = {
      code: '23505',
      constraint: 'advisor_correo_unique',
    };
    advisorRepository.save.mockRejectedValueOnce(queryError1);

    await expect(
      service.create({
        nombre: 'Ana Pérez',
        correo: 'ana@example.com',
        telefono: '3001234567',
        idUsuario: 'user-1',
      }),
    ).rejects.toThrow(ConflictException);

    const queryError2 = new QueryFailedError(
      'query',
      [],
      new Error('duplicate'),
    );
    (queryError2 as any).driverError = {
      code: '23505',
      constraint: 'fk_id_usuario',
    };
    advisorRepository.save.mockRejectedValueOnce(queryError2);

    await expect(
      service.create({
        nombre: 'Ana Pérez',
        correo: 'ana@example.com',
        telefono: '3001234567',
        idUsuario: 'user-1',
      }),
    ).rejects.toThrow(ConflictException);

    const queryError3 = new QueryFailedError(
      'query',
      [],
      new Error('duplicate'),
    );
    (queryError3 as any).driverError = {
      code: '23505',
      constraint: 'other_unique_constraint',
    };
    advisorRepository.save.mockRejectedValueOnce(queryError3);

    await expect(
      service.create({
        nombre: 'Ana Pérez',
        correo: 'ana@example.com',
        telefono: '3001234567',
        idUsuario: 'user-1',
      }),
    ).rejects.toThrow('An advisor with the same unique value already exists');
  });

  it('validates types and matching user email', async () => {
    await expect(
      service.create({
        nombre: 123 as any,
        correo: 'ana@example.com',
        telefono: '3001234567',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.create({
        nombre: 'Ana Pérez',
        correo: 'mismatch@example.com',
        telefono: '3001234567',
        idUsuario: 'user-1',
      }),
    ).rejects.toThrow('The advisor email must match the linked user email');
  });

  it('updates advisor with user link checking exceptId', async () => {
    const updated = await service.update(1, {
      idUsuario: 'user-1',
    });
    expect(updated).toBeDefined();
    expect(advisorQuery.andWhere).toHaveBeenCalledWith(
      'advisor.idAsesor <> :exceptId',
      { exceptId: 1 },
    );
  });
});
