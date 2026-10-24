import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface UpdateClientContactInput {
  actorId?: number;
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
    private readonly activityLog: ActivityLogService,
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

    const saved = await this.contactRepository.save(contact);

    if (input.actorId !== undefined) {
      await this.activityLog.record({
        action: 'client.contact_updated',
        entityType: 'client_contact',
        entityId: saved.id!,
        clientId: saved.clientId,
        actorId: input.actorId,
        description: `Contact ${saved.name} updated`,
      });
    }

    return saved;
  }
}
