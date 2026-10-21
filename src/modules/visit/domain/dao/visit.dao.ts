import { Visit } from '../visit.entity.js';

export interface VisitAgendaFilters {
  advisorId: number;
  startDate: Date;
  endDate: Date;
}

export abstract class VisitDao {
  abstract findAgenda(filters: VisitAgendaFilters): Promise<Visit[]>;

  abstract findById(id: number): Promise<Visit | null>;

  abstract save(visit: Visit): Promise<Visit>;

  abstract findByIdAndAdvisor(
    id: number,
    advisorId: number,
  ): Promise<Visit | null>;
}
