import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
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
});
