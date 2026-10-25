import { Visit, VisitResult, VisitStatus } from '../../domain/visit.entity.js';

import { VisitOrmEntity } from '../visit.orm-entity.js';

export class VisitMapper {
  static toDomain(entity: VisitOrmEntity): Visit {
    const results: VisitResult[] = (entity.resultLinks ?? [])
      .filter((link) => link.resultOption)
      .map((link) => ({
        id: link.resultId,
        name: link.resultOption?.name ?? '',
        observation: link.observation ?? undefined,
      }));

    return new Visit({
      id: entity.id,
      clientId: entity.clientId,
      advisorId: entity.advisorId,
      routeId: entity.routeId,
      scheduledAt: entity.scheduledAt,
      actualDate: entity.actualDate,
      startTime: entity.startTime,
      endTime: entity.endTime,
      status: entity.status as VisitStatus,
      objective: entity.objective,
      observations: entity.observations,
      results,
      quoteGenerated: entity.quoteGenerated ?? false,
      orderGenerated: entity.orderGenerated ?? false,
    });
  }

  static toPersistence(visit: Visit): VisitOrmEntity {
    const props = visit.toJSON();

    const entity = new VisitOrmEntity();

    entity.id = props.id;
    entity.clientId = props.clientId;
    entity.advisorId = props.advisorId;
    entity.routeId = props.routeId;
    entity.scheduledAt = props.scheduledAt;
    entity.actualDate = props.actualDate;
    entity.startTime = props.startTime;
    entity.endTime = props.endTime;
    entity.status = props.status;
    entity.objective = props.objective;
    entity.observations = props.observations ?? null;
    entity.quoteGenerated = props.quoteGenerated ?? false;
    entity.orderGenerated = props.orderGenerated ?? false;

    return entity;
  }
}
