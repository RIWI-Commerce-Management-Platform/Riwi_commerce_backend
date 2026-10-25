import { User } from './user.entity.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

export interface UserFilterCriteria {
  role?: UserRole;
  zoneId?: number;
  search?: string;
  page: number;
  limit: number;
}

export abstract class UserDao {
  abstract findById(id: number): Promise<User | null>;
  abstract findPaginated(
    criteria: UserFilterCriteria,
  ): Promise<PaginatedResult<User>>;
}
