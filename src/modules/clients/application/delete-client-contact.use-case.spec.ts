import { describe, expect, it, vi } from 'vitest';
import { DeleteClientContactUseCase } from './delete-client-contact.use-case.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { ClientContact } from '../domain/client-contact.entity.js';

describe('DeleteClientContactUseCase', () => {
  const createContact = (clientId = 1, id = 10) =>
    new ClientContact({
      id,
      clientId,
      name: 'Contacto Test',
      email: 'test@contact.com',
      phone: '3001234567',
      position: 'Gerente',
      mobile: '3001234567',
      isPrimary: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const setup = () => {
    const contactDao = {
      findById: vi.fn(),
      save: vi.fn((c) => Promise.resolve(c)),
    } as unknown as ClientContactDao;

    const activityLog = { record: vi.fn() };
    const useCase = new DeleteClientContactUseCase(
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

  it('should throw ClientContactNotFoundError if contact belongs to another client', async () => {
    const { useCase, contactDao } = setup();
    const contact = createContact(2, 10);
    vi.mocked(contactDao.findById).mockResolvedValue(contact);

    await expect(
      useCase.execute({ clientId: 1, contactId: 10 }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should deactivate contact and save', async () => {
    const { useCase, contactDao } = setup();
    const contact = createContact(1, 10);
    vi.mocked(contactDao.findById).mockResolvedValue(contact);

    const result = await useCase.execute({ clientId: 1, contactId: 10 });
    expect(contact.isActive).toBe(false);
    expect(contactDao.save).toHaveBeenCalledWith(contact);
    expect(result.isActive).toBe(false);
  });

  it('records the change in the activity log when an actor is given', async () => {
    const { useCase, contactDao, activityLog } = setup();
    vi.mocked(contactDao.findById).mockResolvedValue(createContact());

    await useCase.execute({ clientId: 1, contactId: 10, actorId: 3 });

    expect(activityLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'client.contact_deactivated',
        actorId: 3,
      }),
    );
  });
});
