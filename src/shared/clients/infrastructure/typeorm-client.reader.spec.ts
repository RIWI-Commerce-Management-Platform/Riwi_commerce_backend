import { describe, expect, it, vi } from 'vitest';
import { TypeOrmClientReader } from './typeorm-client.reader.js';
import { ClientDao } from '../../../modules/clients/domain/client.dao.js';
import { ClientContactDao } from '../../../modules/clients/domain/client-contact.dao.js';
import { CatalogDao } from '../../../modules/catalogs/domain/catalog.dao.js';

describe('TypeOrmClientReader', () => {
  const setup = () => {
    const clientDao = {
      findById: vi.fn(),
    } as unknown as ClientDao;

    const contactDao = {
      findByClientId: vi.fn(),
    } as unknown as ClientContactDao;

    const catalogDao = {
      findPotentialById: vi.fn(),
    } as unknown as CatalogDao;

    const reader = new TypeOrmClientReader(clientDao, contactDao, catalogDao);
    return { reader, clientDao, contactDao, catalogDao };
  };

  it('should return null when client is not found', async () => {
    const { reader, clientDao } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue(null);

    const result = await reader.findById(1);
    expect(result).toBeNull();
  });

  it('should return client snapshot with primary contact and potential', async () => {
    const { reader, clientDao, contactDao, catalogDao } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue({
      id: 1,
      commercialName: 'Tienda Central',
      potentialId: 10,
    } as any);

    vi.mocked(contactDao.findByClientId).mockResolvedValue([
      { name: 'Juan', isPrimary: false } as any,
      { name: 'Maria', isPrimary: true } as any,
    ]);

    vi.mocked(catalogDao.findPotentialById).mockResolvedValue({
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
    const { reader, clientDao, contactDao, catalogDao } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue({
      id: 2,
      commercialName: 'Tienda Norte',
      potentialId: 10,
    } as any);

    vi.mocked(contactDao.findByClientId).mockResolvedValue([
      { name: 'Pedro', isPrimary: false } as any,
    ]);

    vi.mocked(catalogDao.findPotentialById).mockResolvedValue(null);

    const result = await reader.findById(2);
    expect(result).toEqual({
      id: 2,
      name: 'Tienda Norte',
      contactName: 'Pedro',
      potential: null,
    });
  });

  it('returns null contact and potential when the client has neither', async () => {
    const { reader, clientDao, contactDao, catalogDao } = setup();
    vi.mocked(clientDao.findById).mockResolvedValue({
      id: 1,
      commercialName: 'Tienda',
      potentialId: 9,
    } as any);
    vi.mocked(contactDao.findByClientId).mockResolvedValue([]);
    vi.mocked(catalogDao.findPotentialById).mockResolvedValue(null);

    expect(await reader.findById(1)).toEqual({
      id: 1,
      name: 'Tienda',
      contactName: null,
      potential: null,
    });
  });
});
