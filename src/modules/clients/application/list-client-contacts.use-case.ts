import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

@Injectable()
export class ListClientContactsUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly contactRepository: ClientContactRepository,
  ) {}

  async execute(clientId: number): Promise<ClientContact[]> {
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError(clientId);
    }

    return this.contactRepository.findByClientId(clientId);
  }
}
