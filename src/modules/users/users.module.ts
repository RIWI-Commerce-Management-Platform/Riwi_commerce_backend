import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './domain/user.repository.js';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository.js';
import { ListUsersUseCase } from './application/list-users.use-case.js';
import { GetUserByIdUseCase } from './application/get-user-by-id.use-case.js';
import { AssignUserRoleUseCase } from './application/assign-user-role.use-case.js';
import { UsersController } from './presentation/users.controller.js';
import { UserOrmEntity } from '../auth/infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../zones/infrastructure/zone.orm-entity.js';

/** User administration: list, detail and role assignment (Admin only). */
@Module({
  imports: [
    // UserOrmEntity is also needed by RolesGuard
    TypeOrmModule.forFeature([UserOrmEntity, ZoneOrmEntity]),
  ],
  controllers: [UsersController],
  providers: [
    ListUsersUseCase,
    GetUserByIdUseCase,
    AssignUserRoleUseCase,
    { provide: UserRepository, useClass: TypeOrmUserRepository },
  ],
  exports: [AssignUserRoleUseCase],
})
export class UsersModule {}
