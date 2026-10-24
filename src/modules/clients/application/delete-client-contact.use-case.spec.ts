import { describe, expect, it, vi } from 'vitest';
import { DeleteClientContactUseCase } from './delete-client-contact.use-case.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
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
      roleOrPosition: 'Gerente',
      isPrimary: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const setup = () => {
    const contactRepo = {
      findById: vi.fn(),
      save: vi.fn((c) => Promise.resolve(c)),
    } as unknown as ClientContactRepository;

    const useCase = new DeleteClientContactUseCase(contactRepo, {
      record: vi.fn(),
    } as any);
    return { useCase, contactRepo };
  };

  it('should throw ClientContactNotFoundError if contact does not exist', async () => {
    const { useCase, contactRepo } = setup();
    vi.mocked(contactRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ clientId: 1, contactId: 99 }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should throw ClientContactNotFoundError if contact belongs to another client', async () => {
    const { useCase, contactRepo } = setup();
    const contact = createContact(2, 10);
    vi.mocked(contactRepo.findById).mockResolvedValue(contact);

    await expect(
      useCase.execute({ clientId: 1, contactId: 10 }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should deactivate contact and save', async () => {
    const { useCase, contactRepo } = setup();
    const contact = createContact(1, 10);
    vi.mocked(contactRepo.findById).mockResolvedValue(contact);

    const result = await useCase.execute({ clientId: 1, contactId: 10 });
    expect(contact.isActive).toBe(false);
    expect(contactRepo.save).toHaveBeenCalledWith(contact);
    expect(result.isActive).toBe(false);
  });
});
