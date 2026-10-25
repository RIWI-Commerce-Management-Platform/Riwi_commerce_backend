import { Injectable } from '@nestjs/common';
import { Client } from '../domain/client.entity.js';
import { ClientDao } from '../domain/client.dao.js';
import { ClientNotFoundError } from '../domain/client-not-found.error.js';

@Injectable()
export class GetClientByIdUseCase {
  constructor(private readonly clientDao: ClientDao) {}

  async execute(id: number): Promise<Client> {
    const client = await this.clientDao.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id);
    }
    return client;
  }
}
