import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

export interface CreateClientContactInput {
  clientId: number;
  name: string;
  position: string;
  phone: string;
  mobile: string;
  email: string;
  isPrimary?: boolean;
}

@Injectable()
export class CreateClientContactUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly contactRepository: ClientContactRepository,
  ) {}

  async execute(input: CreateClientContactInput): Promise<ClientContact> {
    const client = await this.clientRepository.findById(input.clientId);
    if (!client) {
      throw new ClientNotFoundError(input.clientId);
    }

    const existingContacts = await this.contactRepository.findByClientId(
      input.clientId,
    );

    // Rule: First contact is automatically primary, or if explicitly requested
    const shouldBePrimary =
      input.isPrimary === true || existingContacts.length === 0;

    if (shouldBePrimary) {
      await this.contactRepository.unsetPrimaryByClientId(input.clientId);
    }

    const now = new Date();
    const contact = new ClientContact({
      clientId: input.clientId,
      name: input.name,
      position: input.position,
      phone: input.phone,
      mobile: input.mobile,
      email: input.email,
      isPrimary: shouldBePrimary,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return this.contactRepository.save(contact);
  }
}
