import { Injectable } from '@nestjs/common';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactRepository } from '../domain/client-contact.repository.js';
import { ClientContactNotFoundError } from '../domain/client-contact-not-found.error.js';
import { ActivityLogService } from '../../../shared/activity-log/domain/activity-log.service.js';

export interface DeleteClientContactInput {
  actorId?: number;
  clientId: number;
  contactId: number;
}

@Injectable()
export class DeleteClientContactUseCase {
  constructor(
    private readonly contactRepository: ClientContactRepository,
    private readonly activityLog: ActivityLogService,
  ) {}

  async execute(input: DeleteClientContactInput): Promise<ClientContact> {
    const contact = await this.contactRepository.findById(input.contactId);
    if (!contact || contact.clientId !== input.clientId) {
      throw new ClientContactNotFoundError(input.contactId);
    }

    contact.deactivate();
    const saved = await this.contactRepository.save(contact);

    if (input.actorId !== undefined) {
      await this.activityLog.record({
        action: 'client.contact_deactivated',
        entityType: 'client_contact',
        entityId: saved.id!,
        clientId: saved.clientId,
        actorId: input.actorId,
        description: `Contact ${saved.name} deactivated`,
      });
    }

    return saved;
  }
}
