import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientContact } from '../domain/client-contact.entity.js';
import { ClientContactDao } from '../domain/client-contact.dao.js';
import { ClientContactOrmEntity } from './client-contact.orm-entity.js';
import { ClientContactMapper } from './client-contact.mapper.js';

@Injectable()
export class TypeOrmClientContactDao implements ClientContactDao {
  constructor(
    @InjectRepository(ClientContactOrmEntity)
    private readonly repository: Repository<ClientContactOrmEntity>,
  ) {}

  async save(contact: ClientContact): Promise<ClientContact> {
    const orm = ClientContactMapper.toOrm(contact);
    const saved = await this.repository.save(orm);
    return ClientContactMapper.toDomain(saved);
  }

  async findById(id: number): Promise<ClientContact | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? ClientContactMapper.toDomain(row) : null;
  }

  async findByClientId(clientId: number): Promise<ClientContact[]> {
    const rows = await this.repository.find({
      where: { clientId, isActive: true },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
    return rows.map((row) => ClientContactMapper.toDomain(row));
  }

  async unsetPrimaryByClientId(
    clientId: number,
    excludeContactId?: number,
  ): Promise<void> {
    const qb = this.repository
      .createQueryBuilder()
      .update(ClientContactOrmEntity)
      .set({ isPrimary: false })
      .where('client_id = :clientId', { clientId });

    if (excludeContactId !== undefined) {
      qb.andWhere('id != :excludeContactId', { excludeContactId });
    }

    await qb.execute();
  }
}
