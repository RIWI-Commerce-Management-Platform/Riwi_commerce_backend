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

export class CatalogMapper {
  static toClientTypeDomain(orm: ClientTypeOrmEntity): ClientType {
    return new ClientType({
      id: orm.id,
      name: orm.name,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toClientTypeOrm(domain: ClientType): ClientTypeOrmEntity {
    const orm = new ClientTypeOrmEntity();
    if (domain.id !== undefined) orm.id = domain.id;
    orm.name = domain.name;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  static toPotentialDomain(orm: PotentialOrmEntity): Potential {
    return new Potential({
      id: orm.id,
      name: orm.name,
      order: orm.order,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPotentialOrm(domain: Potential): PotentialOrmEntity {
    const orm = new PotentialOrmEntity();
    if (domain.id !== undefined) orm.id = domain.id;
    orm.name = domain.name;
    orm.order = domain.order;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  static toClientStatusDomain(orm: ClientStatusOrmEntity): ClientStatus {
    return new ClientStatus({
      id: orm.id,
      name: orm.name,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toClientStatusOrm(domain: ClientStatus): ClientStatusOrmEntity {
    const orm = new ClientStatusOrmEntity();
    if (domain.id !== undefined) orm.id = domain.id;
    orm.name = domain.name;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  static toPortfolioDomain(orm: PortfolioOrmEntity): Portfolio {
    return new Portfolio({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPortfolioOrm(domain: Portfolio): PortfolioOrmEntity {
    const orm = new PortfolioOrmEntity();
    if (domain.id !== undefined) orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  static toVisitResultDomain(orm: VisitResultOrmEntity): VisitResult {
    return new VisitResult({
      id: orm.id,
      name: orm.name,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toVisitResultOrm(domain: VisitResult): VisitResultOrmEntity {
    const orm = new VisitResultOrmEntity();
    if (domain.id !== undefined) orm.id = domain.id;
    orm.name = domain.name;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
