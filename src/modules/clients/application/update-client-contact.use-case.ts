import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';

export interface UpdateClientContactInput {
  clientId: number;
  contactId: number;
  name?: string;
  position?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  isPrimary?: boolean;
}

@Injectable()
export class UpdateClientContactUseCase {
  constructor(
    private readonly contactRepository: ClientContactRepository,
  ) {}

  async execute(input: UpdateClientContactInput): Promise<ClientContact> {
    const contact = await this.contactRepository.findById(input.contactId);
    if (!contact || contact.clientId !== input.clientId) {
      throw new ClientContactNotFoundError(input.contactId);
    }

    if (input.isPrimary === true && !contact.isPrimary) {
      await this.contactRepository.unsetPrimaryByClientId(
        input.clientId,
        input.contactId,
      );
    }

    contact.update({
      name: input.name,
      position: input.position,
      phone: input.phone,
      mobile: input.mobile,
      email: input.email,
      isPrimary: input.isPrimary,
    });

    return this.contactRepository.save(contact);
  }
}
