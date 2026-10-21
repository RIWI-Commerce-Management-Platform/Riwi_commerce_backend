import { ClientContact } from './client-contact.entity.js';

export abstract class ClientContactRepository {
  abstract save(contact: ClientContact): Promise<ClientContact>;
  abstract findById(id: number): Promise<ClientContact | null>;
  abstract findByClientId(clientId: number): Promise<ClientContact[]>;
  abstract unsetPrimaryByClientId(
    clientId: number,
    excludeContactId?: number,
  ): Promise<void>;
}
