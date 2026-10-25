import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

@Injectable()
export class ListClientContactsUseCase {
  constructor(
    private readonly clientDao: ClientDao,
    private readonly contactDao: ClientContactDao,
  ) {}

  async execute(clientId: number): Promise<ClientContact[]> {
    const client = await this.clientDao.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError(clientId);
    }

    return this.contactDao.findByClientId(clientId);
  }
}
