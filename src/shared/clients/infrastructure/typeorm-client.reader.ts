import { Injectable } from '@nestjs/common';

import { ClientReader, ClientSnapshot } from '../domain/client-reader.js';
import { ClientDao } from '../../../modules/clients/domain/client.dao.js';
import { ClientContactDao } from '../../../modules/clients/domain/client-contact.dao.js';
import { CatalogDao } from '../../../modules/catalogs/domain/catalog.dao.js';

@Injectable()
export class TypeOrmClientReader implements ClientReader {
  constructor(
    private readonly clientDao: ClientDao,
    private readonly clientContactDao: ClientContactDao,
    private readonly catalogDao: CatalogDao,
  ) {}

  async findById(id: number): Promise<ClientSnapshot | null> {
    const client = await this.clientDao.findById(id);
    if (!client) {
      return null;
    }

    const [contacts, potential] = await Promise.all([
      this.clientContactDao.findByClientId(id),
      this.catalogDao.findPotentialById(client.potentialId),
    ]);
    const primaryContact =
      contacts.find((contact) => contact.isPrimary) ?? contacts[0] ?? null;

    return {
      id: client.id!,
      name: client.commercialName,
      contactName: primaryContact?.name ?? null,
      potential: potential?.name ?? null,
    };
  }
}
