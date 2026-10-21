import { describe, expect, it, vi } from 'vitest';
import { UpdateClientContactUseCase } from './update-client-contact.use-case.js';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';

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
    const contactRepository = {
      save: vi.fn((c: ClientContact) => Promise.resolve(c)),
      findById: vi.fn(),
      findByClientId: vi.fn(),
      unsetPrimaryByClientId: vi.fn(),
    } as unknown as ClientContactRepository;

    const useCase = new UpdateClientContactUseCase(contactRepository);

    return { useCase, contactRepository };
  };

  it('should throw ClientContactNotFoundError if contact does not exist', async () => {
    const { useCase, contactRepository } = setup();
    vi.mocked(contactRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        clientId: 1,
        contactId: 99,
        name: 'New Name',
      }),
    ).rejects.toThrow(ClientContactNotFoundError);
  });

  it('should throw ClientContactNotFoundError if contact belongs to another client', async () => {
    const { useCase, contactRepository } = setup();
    vi.mocked(contactRepository.findById).mockResolvedValue(
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
    const { useCase, contactRepository } = setup();
    vi.mocked(contactRepository.findById).mockResolvedValue(
      createMockContact(false),
    );

    const result = await useCase.execute({
      clientId: 1,
      contactId: 5,
      isPrimary: true,
    });

    expect(result.isPrimary).toBe(true);
    expect(contactRepository.unsetPrimaryByClientId).toHaveBeenCalledWith(1, 5);
    expect(contactRepository.save).toHaveBeenCalled();
  });

  it('should update mutable fields correctly', async () => {
    const { useCase, contactRepository } = setup();
    vi.mocked(contactRepository.findById).mockResolvedValue(
      createMockContact(false),
    );

    const result = await useCase.execute({
      clientId: 1,
      contactId: 5,
      name: 'Updated Contact Name',
      position: 'Director General',
    });

    expect(result.name).toBe('Updated Contact Name');
    expect(result.position).toBe('Director General');
    expect(contactRepository.unsetPrimaryByClientId).not.toHaveBeenCalled();
  });
});
