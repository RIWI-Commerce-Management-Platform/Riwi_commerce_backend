import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity.js';
import { UserRepository } from '../domain/user.repository.js';
import { UserNotFoundError } from '../../auth/domain/errors/user-not-found.error.js';

@Injectable()
export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(`User ${id} does not exist`);
    }
    return user;
  }
}
