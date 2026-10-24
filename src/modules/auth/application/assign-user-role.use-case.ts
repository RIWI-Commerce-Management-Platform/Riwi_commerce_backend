import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { UserRole } from '../domain/user-role.enum.js';
import { InvalidRoleError } from '../domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';
import { AdvisorOrmEntity } from '../../advisors/infrastructure/advisor.orm-entity.js';
import { ClientOrmEntity } from '../../clients/infrastructure/client.orm-entity.js';

export interface AssignUserRoleInput {
  userId: string;
  role: UserRole;
  zoneId?: number;
}

export interface AssignUserRoleResult {
  id: string;
  role: UserRole;
  zoneId: number | null;
}

@Injectable()
export class AssignUserRoleUseCase {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(ZoneOrmEntity)
    private readonly zoneRepository: Repository<ZoneOrmEntity>,
    @Optional()
    @InjectRepository(AdvisorOrmEntity)
    private readonly advisorRepository?: Repository<AdvisorOrmEntity>,
    @Optional()
    @InjectRepository(ClientOrmEntity)
    private readonly clientRepository?: Repository<ClientOrmEntity>,
  ) {}

  async execute(input: AssignUserRoleInput): Promise<AssignUserRoleResult> {
    if (!Object.values(UserRole).includes(input.role)) {
      throw new InvalidRoleError();
    }

    let zoneId: number | null = null;
    if (input.role === UserRole.DIRECTOR_REGIONAL) {
      if (!input.zoneId || !Number.isInteger(input.zoneId)) {
        throw new ZoneRequiredError();
      }

      const zone = await this.zoneRepository.findOneBy({ id: input.zoneId });
      if (!zone) {
        throw new ZoneNotFoundError();
      }
      zoneId = zone.id!;
    } else if (input.zoneId) {
      throw new UnexpectedZoneError();
    }

    const user = await this.userRepository.findOneBy({ id: input.userId });
    if (!user) {
      throw new UserNotFoundError();
    }

    const [advisor, client] = await Promise.all([
      this.advisorRepository
        ? this.advisorRepository.findOneBy({ idUsuario: user.id })
        : Promise.resolve(null),
      this.clientRepository
        ? this.clientRepository.findOneBy({ idUsuario: user.id })
        : Promise.resolve(null),
    ]);

    const isAdmin =
      input.role === UserRole.ADMINISTRADOR ||
      (input.role as any) === UserRole.ADMIN;

    if (isAdmin) {
      if (advisor && this.advisorRepository) {
        advisor.idUsuario = null;
        advisor.usuario = null;
        await this.advisorRepository.save(advisor);
      }
      if (client && this.clientRepository) {
        client.idUsuario = null;
        client.usuario = null;
        await this.clientRepository.save(client);
      }
    } else if (
      (input.role === UserRole.ASESOR &&
        (!advisor ||
          client ||
          advisor.correo.toLowerCase() !== user.email?.toLowerCase())) ||
      (input.role === UserRole.CLIENTE &&
        (!client ||
          advisor ||
          client.email.toLowerCase() !== user.email?.toLowerCase()))
    ) {
      throw new InvalidRoleError();
    } else if (input.role === UserRole.DIRECTOR_REGIONAL) {
      if (advisor && this.advisorRepository) {
        advisor.idUsuario = null;
        advisor.usuario = null;
        await this.advisorRepository.save(advisor);
      }
      if (client && this.clientRepository) {
        client.idUsuario = null;
        client.usuario = null;
        await this.clientRepository.save(client);
      }
    }

    user.role = input.role;
    user.zoneId = zoneId;
    await this.userRepository.save(user);

    return { id: user.id, role: user.role, zoneId: user.zoneId };
  }
}
