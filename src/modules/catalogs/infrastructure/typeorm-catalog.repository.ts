import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AllCatalogs,
  CatalogRepository,
  CatalogSeedData,
} from '../domain/catalog.repository.js';
import {
  ClientType,
  Potential,
  ClientStatus,
  Portfolio,
  VisitResult,
} from '../domain/catalog-item.entity.js';
import { ClientTypeOrmEntity } from './client-type.orm-entity.js';
import { PotentialOrmEntity } from './potential.orm-entity.js';
import { ClientStatusOrmEntity } from './client-status.orm-entity.js';
import { PortfolioOrmEntity } from './portfolio.orm-entity.js';
import { VisitResultOrmEntity } from './visit-result.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { CatalogMapper } from './catalog.mapper.js';
import { ZoneMapper } from '../../zones/infrastructure/zone.mapper.js';

@Injectable()
export class TypeOrmCatalogRepository implements CatalogRepository {
  constructor(
    @InjectRepository(ClientTypeOrmEntity)
    private readonly clientTypeRepo: Repository<ClientTypeOrmEntity>,
    @InjectRepository(PotentialOrmEntity)
    private readonly potentialRepo: Repository<PotentialOrmEntity>,
    @InjectRepository(ClientStatusOrmEntity)
    private readonly clientStatusRepo: Repository<ClientStatusOrmEntity>,
    @InjectRepository(PortfolioOrmEntity)
    private readonly portfolioRepo: Repository<PortfolioOrmEntity>,
    @InjectRepository(VisitResultOrmEntity)
    private readonly visitResultRepo: Repository<VisitResultOrmEntity>,
    @InjectRepository(ZoneOrmEntity)
    private readonly zoneRepo: Repository<ZoneOrmEntity>,
  ) {}

  async findAll(): Promise<AllCatalogs> {
    const [
      zones,
      clientTypes,
      potentials,
      clientStatuses,
      portfolios,
      visitResults,
    ] = await Promise.all([
      this.zoneRepo.find({ where: { isActive: true }, order: { name: 'ASC' } }),
      this.clientTypeRepo.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      }),
      this.potentialRepo.find({
        where: { isActive: true },
        order: { order: 'ASC' },
      }),
      this.clientStatusRepo.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      }),
      this.portfolioRepo.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      }),
      this.visitResultRepo.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      }),
    ]);

    return {
      zones: zones.map((z) => ZoneMapper.toDomain(z)),
      clientTypes: clientTypes.map((c) => CatalogMapper.toClientTypeDomain(c)),
      potentials: potentials.map((p) => CatalogMapper.toPotentialDomain(p)),
      clientStatuses: clientStatuses.map((s) =>
        CatalogMapper.toClientStatusDomain(s),
      ),
      portfolios: portfolios.map((p) => CatalogMapper.toPortfolioDomain(p)),
      visitResults: visitResults.map((v) =>
        CatalogMapper.toVisitResultDomain(v),
      ),
    };
  }

  async findClientTypes(): Promise<ClientType[]> {
    const rows = await this.clientTypeRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return rows.map((r) => CatalogMapper.toClientTypeDomain(r));
  }

  async findClientTypeById(id: string): Promise<ClientType | null> {
    const row = await this.clientTypeRepo.findOneBy({ id });
    return row ? CatalogMapper.toClientTypeDomain(row) : null;
  }

  async saveClientType(item: ClientType): Promise<ClientType> {
    const orm = CatalogMapper.toClientTypeOrm(item);
    const saved = await this.clientTypeRepo.save(orm);
    return CatalogMapper.toClientTypeDomain(saved);
  }

  async findPotentials(): Promise<Potential[]> {
    const rows = await this.potentialRepo.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });
    return rows.map((r) => CatalogMapper.toPotentialDomain(r));
  }

  async findPotentialById(id: string): Promise<Potential | null> {
    const row = await this.potentialRepo.findOneBy({ id });
    return row ? CatalogMapper.toPotentialDomain(row) : null;
  }

  async savePotential(item: Potential): Promise<Potential> {
    const orm = CatalogMapper.toPotentialOrm(item);
    const saved = await this.potentialRepo.save(orm);
    return CatalogMapper.toPotentialDomain(saved);
  }

  async findClientStatuses(): Promise<ClientStatus[]> {
    const rows = await this.clientStatusRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return rows.map((r) => CatalogMapper.toClientStatusDomain(r));
  }

  async findClientStatusById(id: string): Promise<ClientStatus | null> {
    const row = await this.clientStatusRepo.findOneBy({ id });
    return row ? CatalogMapper.toClientStatusDomain(row) : null;
  }

  async saveClientStatus(item: ClientStatus): Promise<ClientStatus> {
    const orm = CatalogMapper.toClientStatusOrm(item);
    const saved = await this.clientStatusRepo.save(orm);
    return CatalogMapper.toClientStatusDomain(saved);
  }

  async findPortfolios(): Promise<Portfolio[]> {
    const rows = await this.portfolioRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return rows.map((r) => CatalogMapper.toPortfolioDomain(r));
  }

  async findPortfolioById(id: string): Promise<Portfolio | null> {
    const row = await this.portfolioRepo.findOneBy({ id });
    return row ? CatalogMapper.toPortfolioDomain(row) : null;
  }

  async savePortfolio(item: Portfolio): Promise<Portfolio> {
    const orm = CatalogMapper.toPortfolioOrm(item);
    const saved = await this.portfolioRepo.save(orm);
    return CatalogMapper.toPortfolioDomain(saved);
  }

  async findVisitResults(): Promise<VisitResult[]> {
    const rows = await this.visitResultRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return rows.map((r) => CatalogMapper.toVisitResultDomain(r));
  }

  async findVisitResultById(id: string): Promise<VisitResult | null> {
    const row = await this.visitResultRepo.findOneBy({ id });
    return row ? CatalogMapper.toVisitResultDomain(row) : null;
  }

  async saveVisitResult(item: VisitResult): Promise<VisitResult> {
    const orm = CatalogMapper.toVisitResultOrm(item);
    const saved = await this.visitResultRepo.save(orm);
    return CatalogMapper.toVisitResultDomain(saved);
  }

  async seed(data: CatalogSeedData): Promise<{
    seeded: boolean;
    counts: Record<string, number>;
  }> {
    const counts: Record<string, number> = {};

    // 1. Zones (Barranquilla, Soledad, Malambo, Galapa)
    for (const name of data.zones) {
      const exists = await this.zoneRepo.findOneBy({ name });
      if (!exists) {
        const zone = new ZoneOrmEntity();
        zone.id = randomUUID();
        zone.name = name;
        zone.isActive = true;
        await this.zoneRepo.save(zone);
      }
    }
    counts.zones = await this.zoneRepo.count();

    // 2. Client Types
    for (const name of data.clientTypes) {
      const exists = await this.clientTypeRepo.findOneBy({ name });
      if (!exists) {
        const ct = new ClientTypeOrmEntity();
        ct.id = randomUUID();
        ct.name = name;
        ct.isActive = true;
        await this.clientTypeRepo.save(ct);
      }
    }
    counts.clientTypes = await this.clientTypeRepo.count();

    // 3. Potentials
    for (const p of data.potentials) {
      const exists = await this.potentialRepo.findOneBy({ name: p.name });
      if (!exists) {
        const pot = new PotentialOrmEntity();
        pot.id = randomUUID();
        pot.name = p.name;
        pot.order = p.order;
        pot.isActive = true;
        await this.potentialRepo.save(pot);
      }
    }
    counts.potentials = await this.potentialRepo.count();

    // 4. Client Statuses
    for (const name of data.clientStatuses) {
      const exists = await this.clientStatusRepo.findOneBy({ name });
      if (!exists) {
        const cs = new ClientStatusOrmEntity();
        cs.id = randomUUID();
        cs.name = name;
        cs.isActive = true;
        await this.clientStatusRepo.save(cs);
      }
    }
    counts.clientStatuses = await this.clientStatusRepo.count();

    // 5. Portfolios
    for (const port of data.portfolios) {
      const exists = await this.portfolioRepo.findOneBy({ name: port.name });
      if (!exists) {
        const po = new PortfolioOrmEntity();
        po.id = randomUUID();
        po.name = port.name;
        po.description = port.description;
        po.isActive = true;
        await this.portfolioRepo.save(po);
      }
    }
    counts.portfolios = await this.portfolioRepo.count();

    // 6. Visit Results
    for (const name of data.visitResults) {
      const exists = await this.visitResultRepo.findOneBy({ name });
      if (!exists) {
        const vr = new VisitResultOrmEntity();
        vr.id = randomUUID();
        vr.name = name;
        vr.isActive = true;
        await this.visitResultRepo.save(vr);
      }
    }
    counts.visitResults = await this.visitResultRepo.count();

    return { seeded: true, counts };
  }
}
