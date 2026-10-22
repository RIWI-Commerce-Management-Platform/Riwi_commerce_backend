import { Injectable } from '@nestjs/common';

import { ClientReader, ClientSnapshot } from '../domain/client-reader.js';
import { ClientRepository } from '../../../modules/clients/domain/client.repository.js';
import { ClientContactRepository } from '../../../modules/clients/domain/client-contact.repository.js';
import { CatalogRepository } from '../../../modules/catalogs/domain/catalog.repository.js';

@Injectable()
export class TypeOrmClientReader implements ClientReader {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly clientContactRepository: ClientContactRepository,
    private readonly catalogRepository: CatalogRepository,
  ) {}

  async findById(id: number): Promise<ClientSnapshot | null> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      return null;
    }

    const [contacts, potential] = await Promise.all([
      this.clientContactRepository.findByClientId(id),
      this.catalogRepository.findPotentialById(client.potentialId),
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
