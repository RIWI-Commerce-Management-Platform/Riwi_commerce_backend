import { describe, expect, it, vi } from 'vitest';
import { SetPrimaryContactUseCase } from './set-primary-contact.use-case.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
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
      mobile: '',
      position: 'Gerente',
      isPrimary,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const setup = () => {
    const contactRepo = {
      findById: vi.fn(),
      unsetPrimaryByClientId: vi.fn().mockResolvedValue(undefined),
      save: vi.fn((c) => Promise.resolve(c)),
    } as unknown as ClientContactRepository;

    const useCase = new SetPrimaryContactUseCase(contactRepo);
    return { useCase, contactRepo };
  };

  it('should throw ClientContactNotFoundError if contact does not exist', async () => {
    const { useCase, contactRepo } = setup();
    vi.mocked(contactRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ clientId: 1, contactId: 99 }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should throw ClientContactNotFoundError if contact belongs to a different client', async () => {
    const { useCase, contactRepo } = setup();
    const contact = createContact(false, 2, 10);
    vi.mocked(contactRepo.findById).mockResolvedValue(contact);

    await expect(
      useCase.execute({ clientId: 1, contactId: 10 }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should return contact directly if already primary', async () => {
    const { useCase, contactRepo } = setup();
    const contact = createContact(true, 1, 10);
    vi.mocked(contactRepo.findById).mockResolvedValue(contact);

    const result = await useCase.execute({ clientId: 1, contactId: 10 });
    expect(result).toBe(contact);
    expect(contactRepo.unsetPrimaryByClientId).not.toHaveBeenCalled();
    expect(contactRepo.save).not.toHaveBeenCalled();
  });

  it('should unset other primaries, mark contact as primary, and save', async () => {
    const { useCase, contactRepo } = setup();
    const contact = createContact(false, 1, 10);
    vi.mocked(contactRepo.findById).mockResolvedValue(contact);

    const result = await useCase.execute({ clientId: 1, contactId: 10 });

    expect(contactRepo.unsetPrimaryByClientId).toHaveBeenCalledWith(1, 10);
    expect(contact.isPrimary).toBe(true);
    expect(contactRepo.save).toHaveBeenCalledWith(contact);
    expect(result.isPrimary).toBe(true);
  });
});
