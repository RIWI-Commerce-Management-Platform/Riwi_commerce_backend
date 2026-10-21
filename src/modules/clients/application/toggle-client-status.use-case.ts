import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

export interface ToggleClientStatusInput {
  id: number;
  isActive?: boolean;
}

@Injectable()
export class ToggleClientStatusUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(input: ToggleClientStatusInput): Promise<Client> {
    const client = await this.clientRepository.findById(input.id);
    if (!client) {
      throw new ClientNotFoundError(input.id);
    }

    if (input.isActive !== undefined) {
      if (input.isActive) {
        client.activate();
      } else {
        client.deactivate();
      }
    } else {
      if (client.isActive) {
        client.deactivate();
      } else {
        client.activate();
      }
    }

    return this.clientRepository.save(client);
  }
}
