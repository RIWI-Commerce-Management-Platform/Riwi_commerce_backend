import { describe, expect, it, vi } from 'vitest';
import { UpdateClientContactUseCase } from './update-client-contact.use-case.js';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';

describe('UpdateClientContactUseCase', () => {
  const createMockContact = (isPrimary = false): ClientContact =>
    new ClientContact({
      id: 5,
      clientId: 1,
      name: 'Original Contact',
      position: 'Gerente',
      phone: '111',
      mobile: '222',
      email: 'original@test.com',
      isPrimary,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const setup = () => {
    const contactDao = {
      save: vi.fn((c: ClientContact) => Promise.resolve(c)),
      findById: vi.fn(),
      findByClientId: vi.fn(),
      unsetPrimaryByClientId: vi.fn(),
    } as unknown as ClientContactDao;

    const activityLog = { record: vi.fn() };
    const useCase = new UpdateClientContactUseCase(
      contactDao,
      activityLog as any,
    );

    return { useCase, contactDao, activityLog };
  };

  it('should throw ClientContactNotFoundError if contact does not exist', async () => {
    const { useCase, contactDao } = setup();
    vi.mocked(contactDao.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        clientId: 1,
        contactId: 99,
        name: 'New Name',
      }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should throw ClientContactNotFoundError if contact belongs to another client', async () => {
    const { useCase, contactDao } = setup();
    vi.mocked(contactDao.findById).mockResolvedValue(
      createMockContact(false), // clientId is 1
    );

    await expect(
      useCase.execute({
        clientId: 999, // mismatch
        contactId: 5,
        name: 'New Name',
      }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should promote contact to primary and unset others', async () => {
    const { useCase, contactDao } = setup();
    vi.mocked(contactDao.findById).mockResolvedValue(createMockContact(false));

    const result = await useCase.execute({
      clientId: 1,
      contactId: 5,
      isPrimary: true,
    });

    expect(result.isPrimary).toBe(true);
    expect(contactDao.unsetPrimaryByClientId).toHaveBeenCalledWith(1, 5);
    expect(contactDao.save).toHaveBeenCalled();
  });

  it('should update mutable fields correctly', async () => {
    const { useCase, contactDao } = setup();
    vi.mocked(contactDao.findById).mockResolvedValue(createMockContact(false));

    const result = await useCase.execute({
      clientId: 1,
      contactId: 5,
      name: 'Updated Contact Name',
      position: 'Director General',
    });

    expect(result.name).toBe('Updated Contact Name');
    expect(result.position).toBe('Director General');
    expect(contactDao.unsetPrimaryByClientId).not.toHaveBeenCalled();
  });

  it('records the change in the activity log when an actor is given', async () => {
    const { useCase, contactDao, activityLog } = setup();
    vi.mocked(contactDao.findById).mockResolvedValue(createMockContact(false));

    await useCase.execute({
      clientId: 1,
      contactId: 5,
      name: 'Nuevo',
      actorId: 3,
    });

    expect(activityLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'client.contact_updated', actorId: 3 }),
    );
  });
});
