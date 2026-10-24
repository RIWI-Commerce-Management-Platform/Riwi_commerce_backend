import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity.js';
import {
  UserFilterCriteria,
  UserRepository,
} from '../domain/user.repository.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

/** Lists every user (admins, regional directors and advisors). */
@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(criteria: UserFilterCriteria): Promise<PaginatedResult<User>> {
    return this.userRepository.findPaginated(criteria);
  }
}
