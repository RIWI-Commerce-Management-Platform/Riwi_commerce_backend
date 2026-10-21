import { FollowUp } from '../domain/follow-up.entity.js';
import { FollowUpOrmEntity } from './follow-up.orm-entity.js';

export class FollowUpMapper {
  static toDomain(entity: FollowUpOrmEntity): FollowUp {
    return new FollowUp({
      id: entity.id,
      visitId: entity.visitId,
      nextDate: entity.nextDate,
      activity: entity.activity,
      observation: entity.observation,
      responsibleAdvisorId: entity.responsibleAdvisorId,
      completed: entity.completed,
    });
  }

  static toPersistence(followUp: FollowUp): FollowUpOrmEntity {
    const entity = new FollowUpOrmEntity();
    entity.id = followUp.id;
    entity.visitId = followUp.visitId;
    entity.nextDate = followUp.nextDate;
    entity.activity = followUp.activity;
    entity.observation = followUp.observation ?? null;
    entity.responsibleAdvisorId = followUp.responsibleAdvisorId;
    entity.completed = followUp.completed;
    return entity;
  }
}
