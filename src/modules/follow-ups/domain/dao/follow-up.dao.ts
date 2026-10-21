import { FollowUp } from '../follow-up.entity.js';

export interface FollowUpFilters {
  advisorId?: number;
  visitId?: number;
  startDate?: Date;
  endDate?: Date;
  completed?: boolean;
}

export abstract class FollowUpDao {
  abstract create(followUp: FollowUp): Promise<FollowUp>;
  abstract save(followUp: FollowUp): Promise<FollowUp>;
  abstract findById(id: number): Promise<FollowUp | null>;
  abstract findByIdAndAdvisor(
    id: number,
    advisorId: number,
  ): Promise<FollowUp | null>;
  abstract findByVisitAndAdvisor(
    visitId: number,
    advisorId: number,
  ): Promise<FollowUp[]>;
  abstract findAll(filters?: FollowUpFilters): Promise<FollowUp[]>;
}
