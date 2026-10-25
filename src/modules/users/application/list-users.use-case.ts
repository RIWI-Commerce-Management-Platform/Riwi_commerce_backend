import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity.js';
import { UserFilterCriteria, UserDao } from '../domain/user.dao.js';
import { PaginatedResult } from '../../../shared/pagination/paginated-result.interface.js';

/** Lists every user (admins, regional directors and advisors). */
@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userDao: UserDao) {}

  execute(criteria: UserFilterCriteria): Promise<PaginatedResult<User>> {
    return this.userDao.findPaginated(criteria);
  }
}
