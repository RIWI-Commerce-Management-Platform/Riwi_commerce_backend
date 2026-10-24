import { FollowUp, FollowUpStatus } from '../follow-up.entity.js';

export interface FollowUpAgendaFilters {
  responsibleId: number;
  startDate: Date;
  endDate: Date;
  status?: FollowUpStatus;
}

export abstract class FollowUpDao {
  abstract save(followUp: FollowUp): Promise<FollowUp>;
  abstract findById(id: number): Promise<FollowUp | null>;
  abstract findAgenda(filters: FollowUpAgendaFilters): Promise<FollowUp[]>;
}
