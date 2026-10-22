import { describe, expect, it, vi } from 'vitest';
import { ListClientContactsUseCase } from './list-client-contacts.use-case.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

describe('ListClientContactsUseCase', () => {
  it('should throw ClientNotFoundError if client does not exist', async () => {
    const clientRepo = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as ClientRepository;

    const contactRepo = {
      findByClientId: vi.fn(),
    } as unknown as ClientContactRepository;

    const useCase = new ListClientContactsUseCase(clientRepo, contactRepo);

    await expect(useCase.execute(999)).rejects.toThrow(ClientNotFoundError);
    expect(contactRepo.findByClientId).not.toHaveBeenCalled();
  });

  it('should return contacts for the client', async () => {
    const clientRepo = {
      findById: vi.fn().mockResolvedValue({ id: 1 }),
    } as unknown as ClientRepository;

    const mockContacts = [{ id: 10, name: 'Contacto 1' }] as any[];
    const contactRepo = {
      findByClientId: vi.fn().mockResolvedValue(mockContacts),
    } as unknown as ClientContactRepository;

    const useCase = new ListClientContactsUseCase(clientRepo, contactRepo);
    const result = await useCase.execute(1);

    expect(clientRepo.findById).toHaveBeenCalledWith(1);
    expect(contactRepo.findByClientId).toHaveBeenCalledWith(1);
    expect(result).toBe(mockContacts);
  });
});
