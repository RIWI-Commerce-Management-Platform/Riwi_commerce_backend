import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface SetPrimaryContactInput {
  actorId?: number;
  clientId: number;
  contactId: number;
}

@Injectable()
export class SetPrimaryContactUseCase {
  constructor(
    private readonly contactDao: ClientContactDao,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(input: SetPrimaryContactInput): Promise<ClientContact> {
    const contact = await this.contactDao.findById(input.contactId);
    if (!contact || contact.clientId !== input.clientId) {
      throw new ClientContactNotFoundError(input.contactId);
    }

    if (contact.isPrimary) {
      return contact;
    }

    await this.contactDao.unsetPrimaryByClientId(
      input.clientId,
      input.contactId,
    );

    contact.markAsPrimary();
    const saved = await this.contactDao.save(contact);

    if (input.actorId !== undefined) {
      await this.activityLog.record({
        action: 'client.contact_primary_set',
        entityType: 'client_contact',
        entityId: saved.id!,
        clientId: saved.clientId,
        actorId: input.actorId,
        description: `Contact ${saved.name} set as primary`,
      });
    }

    return saved;
  }
}
