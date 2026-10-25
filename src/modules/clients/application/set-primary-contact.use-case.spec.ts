import { describe, expect, it, vi } from 'vitest';
import { SetPrimaryContactUseCase } from './set-primary-contact.use-case.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { ClientContact } from '../domain/client-contact.entity.js';

describe('SetPrimaryContactUseCase', () => {
  const createContact = (isPrimary = false, clientId = 1, id = 10) =>
    new ClientContact({
      id,
      clientId,
      name: 'Contacto Test',
      email: 'test@contact.com',
      phone: '3001234567',
      position: 'Gerente',
      mobile: '3001234567',
      isPrimary,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const setup = () => {
    const contactDao = {
      findById: vi.fn(),
      unsetPrimaryByClientId: vi.fn().mockResolvedValue(undefined),
      save: vi.fn((c) => Promise.resolve(c)),
    } as unknown as ClientContactDao;

    const activityLog = { record: vi.fn() };
    const useCase = new SetPrimaryContactUseCase(
      contactDao,
      activityLog as any,
    );
    return { useCase, contactDao, activityLog };
  };

  it('should throw ClientContactNotFoundError if contact does not exist', async () => {
    const { useCase, contactDao } = setup();
    vi.mocked(contactDao.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ clientId: 1, contactId: 99 }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should throw ClientContactNotFoundError if contact belongs to a different client', async () => {
    const { useCase, contactDao } = setup();
    const contact = createContact(false, 2, 10);
    vi.mocked(contactDao.findById).mockResolvedValue(contact);

    await expect(
      useCase.execute({ clientId: 1, contactId: 10 }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should return contact directly if already primary', async () => {
    const { useCase, contactDao } = setup();
    const contact = createContact(true, 1, 10);
    vi.mocked(contactDao.findById).mockResolvedValue(contact);

    const result = await useCase.execute({ clientId: 1, contactId: 10 });
    expect(result).toBe(contact);
    expect(contactDao.unsetPrimaryByClientId).not.toHaveBeenCalled();
    expect(contactDao.save).not.toHaveBeenCalled();
  });

  it('should unset other primaries, mark contact as primary, and save', async () => {
    const { useCase, contactDao } = setup();
    const contact = createContact(false, 1, 10);
    vi.mocked(contactDao.findById).mockResolvedValue(contact);

    const result = await useCase.execute({ clientId: 1, contactId: 10 });

    expect(contactDao.unsetPrimaryByClientId).toHaveBeenCalledWith(1, 10);
    expect(contact.isPrimary).toBe(true);
    expect(contactDao.save).toHaveBeenCalledWith(contact);
    expect(result.isPrimary).toBe(true);
  });

  it('records the change in the activity log when an actor is given', async () => {
    const { useCase, contactDao, activityLog } = setup();
    vi.mocked(contactDao.findById).mockResolvedValue(
      createContact(false, 1, 10),
    );

    await useCase.execute({ clientId: 1, contactId: 10, actorId: 3 });

    expect(activityLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'client.contact_primary_set',
        actorId: 3,
      }),
    );
  });
});
