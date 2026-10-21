import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';

export interface SetPrimaryContactInput {
  clientId: number;
  contactId: number;
}

@Injectable()
export class SetPrimaryContactUseCase {
  constructor(
    private readonly contactRepository: ClientContactRepository,
  ) {}

  async execute(input: SetPrimaryContactInput): Promise<ClientContact> {
    const contact = await this.contactRepository.findById(input.contactId);
    if (!contact || contact.clientId !== input.clientId) {
      throw new ClientContactNotFoundError(input.contactId);
    }

    if (contact.isPrimary) {
      return contact;
    }

    await this.contactRepository.unsetPrimaryByClientId(
      input.clientId,
      input.contactId,
    );

    contact.markAsPrimary();
    return this.contactRepository.save(contact);
  }
}
