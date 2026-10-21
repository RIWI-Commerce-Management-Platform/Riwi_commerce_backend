import { VisitResultOption } from '../../domain/visit-result.entity.js';

import { VisitResultOptionOrmEntity } from '../visit-result-option.orm-entity.js';

export class VisitResultOptionMapper {
  static toDomain(entity: VisitResultOptionOrmEntity): VisitResultOption {
    return new VisitResultOption({
      id: entity.id,
      name: entity.name,
      isActive: entity.isActive,
    });
  }
}
