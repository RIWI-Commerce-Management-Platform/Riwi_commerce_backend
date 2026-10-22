import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { TypeOrmModule } from '@nestjs/typeorm';
import { auth } from './auth.js';
import { UserOrmEntity } from './infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../zones/infrastructure/zone.orm-entity.js';
import { SessionGuard } from './guards/session.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthController } from './presentation/auth.controller.js';
import { LoginUseCase } from './application/login.use-case.js';
import { RegisterUseCase } from './application/register.use-case.js';
import { LogoutUseCase } from './application/logout.use-case.js';
import { GetCurrentUserUseCase } from './application/get-current-user.use-case.js';
import { AssignUserRoleUseCase } from './application/assign-user-role.use-case.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, ZoneOrmEntity]),
    BetterAuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    SessionGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
    LoginUseCase,
    RegisterUseCase,
    LogoutUseCase,
    GetCurrentUserUseCase,
    AssignUserRoleUseCase,
  ],
  exports: [BetterAuthModule, SessionGuard, RolesGuard],
})
export class AuthModule {}
