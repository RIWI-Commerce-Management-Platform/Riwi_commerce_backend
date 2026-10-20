import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientRepository } from '../domain/client.repository.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

@Injectable()
export class GetClientByIdUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(id: string): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id);
    }
    return client;
  }
}

