import { VisitResultOption } from '../visit-result.entity.js';

export abstract class VisitResultCatalogDao {
  abstract findByIds(ids: number[]): Promise<VisitResultOption[]>;

  abstract findAll(): Promise<VisitResultOption[]>;
}
