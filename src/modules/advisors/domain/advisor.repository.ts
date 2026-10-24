import { Advisor } from './advisor.entity.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

export interface AdvisorFilterCriteria {
  search?: string;
  zoneId?: number;
  isActive?: boolean;
  page: number;
  limit: number;
}

export abstract class AdvisorRepository {
  /** Only users with the ASESOR role are advisors. */
  abstract findById(userId: number): Promise<Advisor | null>;
  abstract findPaginated(
    criteria: AdvisorFilterCriteria,
  ): Promise<PaginatedResult<Advisor>>;
  /** Saves the profile and the user's name and email. */
  abstract save(advisor: Advisor): Promise<Advisor>;
  abstract isEmailTaken(email: string, exceptUserId?: number): Promise<boolean>;
  abstract zoneExists(zoneId: number): Promise<boolean>;
}
