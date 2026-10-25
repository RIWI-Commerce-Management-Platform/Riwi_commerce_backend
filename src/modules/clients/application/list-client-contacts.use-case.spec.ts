import { describe, expect, it, vi } from 'vitest';
import { ListClientContactsUseCase } from './list-client-contacts.use-case.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

describe('ListClientContactsUseCase', () => {
  it('should throw ClientNotFoundError if client does not exist', async () => {
    const clientDao = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as ClientDao;

    const contactDao = {
      findByClientId: vi.fn(),
    } as unknown as ClientContactDao;

    const useCase = new ListClientContactsUseCase(clientDao, contactDao);

    await expect(useCase.execute(999)).rejects.toThrow(ClientNotFoundError);
    expect(contactDao.findByClientId).not.toHaveBeenCalled();
  });

  it('should return contacts for the client', async () => {
    const clientDao = {
      findById: vi.fn().mockResolvedValue({ id: 1 }),
    } as unknown as ClientDao;

    const mockContacts = [{ id: 10, name: 'Contacto 1' }] as any[];
    const contactDao = {
      findByClientId: vi.fn().mockResolvedValue(mockContacts),
    } as unknown as ClientContactDao;

    const useCase = new ListClientContactsUseCase(clientDao, contactDao);
    const result = await useCase.execute(1);

    expect(clientDao.findById).toHaveBeenCalledWith(1);
    expect(contactDao.findByClientId).toHaveBeenCalledWith(1);
    expect(result).toBe(mockContacts);
  });
});
