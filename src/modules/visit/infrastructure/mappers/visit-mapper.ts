import { Visit, VisitStatus } from '../../domain/visit.entity.js';

import { VisitOrmEntity } from '../visit.orm-entity.js';

export class VisitMapper {
  static toDomain(entity: VisitOrmEntity): Visit {
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

    return entity;
  }
}
