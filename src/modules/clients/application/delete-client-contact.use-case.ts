import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';

export interface DeleteClientContactInput {
  clientId: number;
  contactId: number;
}

@Injectable()
export class DeleteClientContactUseCase {
  constructor(
    private readonly contactRepository: ClientContactRepository,
  ) {}

  async execute(input: DeleteClientContactInput): Promise<ClientContact> {
    const contact = await this.contactRepository.findById(input.contactId);
    if (!contact || contact.clientId !== input.clientId) {
      throw new ClientContactNotFoundError(input.contactId);
    }

    contact.deactivate();
    return this.contactRepository.save(contact);
  }
}
