import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity.js';
import { UserDao } from '../domain/user.dao.js';
import { UserNotFoundError } from '../../auth/domain/errors/user-not-found.error.js';

@Injectable()
export class GetUserByIdUseCase {
  constructor(private readonly userDao: UserDao) {}

  async execute(id: number): Promise<User> {
    const user = await this.userDao.findById(id);
    if (!user) {
      throw new UserNotFoundError(`User ${id} does not exist`);
    }
    return user;
  }
}
