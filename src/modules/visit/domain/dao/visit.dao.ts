import { Visit } from '../visit.entity.js';

export interface VisitAgendaFilters {
  advisorId?: number;
  startDate: Date;
  endDate: Date;
}

export interface CreateVisitCommand {
  clientId: number;
  advisorId: number;
  routeId?: number | null;
  scheduledAt: Date;
  status?: string;
  objective?: string | null;
  observations?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  quoteGenerated?: boolean;
  orderGenerated?: boolean;
  results?: Array<{ id: number; observation?: string }>;
}

export abstract class VisitDao {
  abstract findAgenda(filters: VisitAgendaFilters): Promise<Visit[]>;

  abstract findById(id: number): Promise<Visit | null>;

  abstract save(visit: Visit): Promise<Visit>;

  abstract findByIdAndAdvisor(
    id: number,
    advisorId: number,
  ): Promise<Visit | null>;

  abstract create(command: CreateVisitCommand): Promise<Visit>;
}
