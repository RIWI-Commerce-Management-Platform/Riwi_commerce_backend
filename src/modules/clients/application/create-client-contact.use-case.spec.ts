import { describe, expect, it, vi } from 'vitest';
import { CreateClientContactUseCase } from './create-client-contact.use-case.js';
import { ClientContact } from '../domain/client-contact.entity.js';
import { Client } from '../domain/client.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';

describe('CreateClientContactUseCase', () => {
  const createMockClient = (): Client =>
    new Client({
      id: 1,
      nit: '900123456-1',
      businessName: 'Distribuidora Los Andes S.A.S.',
      commercialName: 'Los Andes Market',
      address: 'Calle 50 # 45-20',
      department: 'Atlántico',
      municipality: 'Barranquilla',
      neighborhood: 'El Prado',
      phone: '+573001234567',
      email: 'contacto@losandes.com',
      zoneId: 10,
      clientTypeId: 20,
      potentialId: 30,
      clientStatusId: 40,
      visitFrequencyDays: 15,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const setup = () => {
    const clientDao = {
      findById: vi.fn(),
      save: vi.fn(),
      findByNit: vi.fn(),
      findPaginated: vi.fn(),
    } as unknown as ClientDao;

    const contactDao = {
      save: vi.fn((c: ClientContact) => Promise.resolve(c)),
      findById: vi.fn(),
      findByClientId: vi.fn(),
      unsetPrimaryByClientId: vi.fn(),
    } as unknown as ClientContactDao;

    const activityLog = { record: vi.fn() };
    const useCase = new CreateClientContactUseCase(
      clientDao,
      contactDao,
      activityLog as any,
    );

    return { useCase, clientDao, contactDao, activityLog };
  };

  it('should throw ClientNotFoundError if client does not exist', async () => {
    const { useCase, clientDao } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        clientId: 999,
        name: 'Maria Gomez',
        position: 'Compras',
        phone: '123',
        mobile: '456',
        email: 'maria@test.com',
      }),
    ).rejects.toThrow(ClientNotFoundError);
  });

  it('should automatically set the first contact as primary', async () => {
    const { useCase, clientDao, contactDao } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue(createMockClient());
    vi.mocked(contactDao.findByClientId).mockResolvedValue([]);

    const result = await useCase.execute({
      clientId: 1,
      name: 'Maria Gomez',
      position: 'Compras',
      phone: '123',
      mobile: '456',
      email: 'maria@test.com',
      isPrimary: false, // passed false, but since it is the first contact it must be primary
    });

    expect(result.isPrimary).toBe(true);
    expect(contactDao.unsetPrimaryByClientId).toHaveBeenCalledWith(1);
    expect(contactDao.save).toHaveBeenCalled();
  });

  it('should unmark previous primary when creating a new primary contact', async () => {
    const { useCase, clientDao, contactDao } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue(createMockClient());
    vi.mocked(contactDao.findByClientId).mockResolvedValue([
      new ClientContact({
        id: 1,
        clientId: 1,
        name: 'Existing Contact',
        position: 'Ventas',
        phone: '111',
        mobile: '222',
        email: 'test@test.com',
        isPrimary: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ]);

    const result = await useCase.execute({
      clientId: 1,
      name: 'New Primary Contact',
      position: 'Gerente General',
      phone: '333',
      mobile: '444',
      email: 'gerente@test.com',
      isPrimary: true,
    });

    expect(result.isPrimary).toBe(true);
    expect(contactDao.unsetPrimaryByClientId).toHaveBeenCalledWith(1);
  });

  it('should create secondary contact without unsetting primary', async () => {
    const { useCase, clientDao, contactDao } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue(createMockClient());
    vi.mocked(contactDao.findByClientId).mockResolvedValue([
      new ClientContact({
        id: 1,
        clientId: 1,
        name: 'Existing Primary',
        position: 'Ventas',
        phone: '111',
        mobile: '222',
        email: 'test@test.com',
        isPrimary: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ]);

    const result = await useCase.execute({
      clientId: 1,
      name: 'Secondary Contact',
      position: 'Asistente',
      phone: '555',
      mobile: '666',
      email: 'asistente@test.com',
      isPrimary: false,
    });

    expect(result.isPrimary).toBe(false);
    expect(contactDao.unsetPrimaryByClientId).not.toHaveBeenCalled();
  });

  it('records the new contact in the activity log when an actor is given', async () => {
    const { useCase, clientDao, contactDao, activityLog } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue(createMockClient());
    vi.mocked(contactDao.findByClientId).mockResolvedValue([]);

    await useCase.execute({
      clientId: 1,
      name: 'Maria Gomez',
      position: 'Compras',
      phone: '123',
      mobile: '456',
      email: 'maria@test.com',
      isPrimary: true,
      actorId: 3,
    });

    expect(activityLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'client.contact_created', actorId: 3 }),
    );
  });
});
