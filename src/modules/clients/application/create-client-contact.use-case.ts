import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface CreateClientContactInput {
  actorId?: number;
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
    private readonly clientDao: ClientDao,
    private readonly contactDao: ClientContactDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(input: CreateClientContactInput): Promise<ClientContact> {
    const client = await this.clientDao.findById(input.clientId);
    if (!client) {
      throw new ClientNotFoundError(input.clientId);
    }

    const existingContacts = await this.contactDao.findByClientId(
      input.clientId,
    );

    // Rule: First contact is automatically primary, or if explicitly requested
    const shouldBePrimary =
      input.isPrimary === true || existingContacts.length === 0;

    if (shouldBePrimary) {
      await this.contactDao.unsetPrimaryByClientId(input.clientId);
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

    const saved = await this.contactDao.save(contact);

    if (input.actorId !== undefined) {
      await this.activityLog.record({
        action: 'client.contact_created',
        entityType: 'client_contact',
        entityId: saved.id!,
        clientId: saved.clientId,
        actorId: input.actorId,
        description: `Contact ${saved.name} created`,
      });
    }

    return saved;
  }
}
