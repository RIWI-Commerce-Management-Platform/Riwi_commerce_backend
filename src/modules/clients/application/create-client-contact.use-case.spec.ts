import { describe, expect, it, vi } from 'vitest';
import { CreateClientContactUseCase } from './create-client-contact.use-case.js';
import { ClientContact } from '../domain/client-contact.entity.js';
import { Client } from '../domain/client.entity.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';

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
    const clientRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      findByNit: vi.fn(),
      findPaginated: vi.fn(),
    } as unknown as ClientRepository;

    const contactRepository = {
      save: vi.fn((c: ClientContact) => Promise.resolve(c)),
      findById: vi.fn(),
      findByClientId: vi.fn(),
      unsetPrimaryByClientId: vi.fn(),
    } as unknown as ClientContactRepository;

    const useCase = new CreateClientContactUseCase(
      clientRepository,
      contactRepository,
    );

    return { useCase, clientRepository, contactRepository };
  };

  it('should throw ClientNotFoundError if client does not exist', async () => {
    const { useCase, clientRepository } = setup();
    vi.mocked(clientRepository.findById).mockResolvedValue(null);

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
    const { useCase, clientRepository, contactRepository } = setup();
    vi.mocked(clientRepository.findById).mockResolvedValue(createMockClient());
    vi.mocked(contactRepository.findByClientId).mockResolvedValue([]);

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
    expect(contactRepository.unsetPrimaryByClientId).toHaveBeenCalledWith(1);
    expect(contactRepository.save).toHaveBeenCalled();
  });

  it('should unmark previous primary when creating a new primary contact', async () => {
    const { useCase, clientRepository, contactRepository } = setup();
    vi.mocked(clientRepository.findById).mockResolvedValue(createMockClient());
    vi.mocked(contactRepository.findByClientId).mockResolvedValue([
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
    expect(contactRepository.unsetPrimaryByClientId).toHaveBeenCalledWith(1);
  });

  it('should create secondary contact without unsetting primary', async () => {
    const { useCase, clientRepository, contactRepository } = setup();
    vi.mocked(clientRepository.findById).mockResolvedValue(createMockClient());
    vi.mocked(contactRepository.findByClientId).mockResolvedValue([
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
    expect(contactRepository.unsetPrimaryByClientId).not.toHaveBeenCalled();
  });
});
