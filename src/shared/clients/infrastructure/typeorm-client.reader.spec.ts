import { describe, expect, it, vi } from 'vitest';
import { TypeOrmClientReader } from './typeorm-client.reader.js';
import { ClientRepository } from '../../../modules/clients/domain/client.repository.js';
import { ClientContactRepository } from '../../../modules/clients/domain/client-contact.repository.js';
import { CatalogRepository } from '../../../modules/catalogs/domain/catalog.repository.js';

describe('TypeOrmClientReader', () => {
  const setup = () => {
    const clientRepo = {
      findById: vi.fn(),
    } as unknown as ClientRepository;

    const contactRepo = {
      findByClientId: vi.fn(),
    } as unknown as ClientContactRepository;

    const catalogRepo = {
      findPotentialById: vi.fn(),
    } as unknown as CatalogRepository;

    const reader = new TypeOrmClientReader(
      clientRepo,
      contactRepo,
      catalogRepo,
    );
    return { reader, clientRepo, contactRepo, catalogRepo };
  };

  it('should return null when client is not found', async () => {
    const { reader, clientRepo } = setup();
    vi.mocked(clientRepo.findById).mockResolvedValue(null);

    const result = await reader.findById(1);
    expect(result).toBeNull();
  });

  it('should return client snapshot with primary contact and potential', async () => {
    const { reader, clientRepo, contactRepo, catalogRepo } = setup();
    vi.mocked(clientRepo.findById).mockResolvedValue({
      id: 1,
      commercialName: 'Tienda Central',
      potentialId: 10,
    } as any);

    vi.mocked(contactRepo.findByClientId).mockResolvedValue([
      { name: 'Juan', isPrimary: false } as any,
      { name: 'Maria', isPrimary: true } as any,
    ]);

    vi.mocked(catalogRepo.findPotentialById).mockResolvedValue({
      id: 10,
      name: 'Alto',
    } as any);

    const result = await reader.findById(1);
    expect(result).toEqual({
      id: 1,
      name: 'Tienda Central',
      contactName: 'Maria',
      potential: 'Alto',
    });
  });

  it('should fallback to first contact if no primary contact exists', async () => {
    const { reader, clientRepo, contactRepo, catalogRepo } = setup();
    vi.mocked(clientRepo.findById).mockResolvedValue({
      id: 2,
      commercialName: 'Tienda Norte',
      potentialId: 10,
    } as any);

    vi.mocked(contactRepo.findByClientId).mockResolvedValue([
      { name: 'Pedro', isPrimary: false } as any,
    ]);

    vi.mocked(catalogRepo.findPotentialById).mockResolvedValue(null);

    const result = await reader.findById(2);
    expect(result).toEqual({
      id: 2,
      name: 'Tienda Norte',
      contactName: 'Pedro',
      potential: null,
    });
  });
});
