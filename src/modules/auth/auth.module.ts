import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './infrastructure/adapters/better-auth.adapter.js';
import { AccountOrmEntity } from './infrastructure/account.orm-entity.js';
import { VerificationOrmEntity } from './infrastructure/verification.orm-entity.js';
import { UserOrmEntity } from './infrastructure/user.orm-entity.js';
import { AdvisorOrmEntity } from '../advisors/infrastructure/advisor.orm-entity.js';
import { ClientOrmEntity } from '../clients/infrastructure/client.orm-entity.js';
import { ZoneOrmEntity } from '../zones/infrastructure/zone.orm-entity.js';
import { RedisService } from './infrastructure/redis.service.js';
import { AuthTokenService } from './application/auth-token.service.js';
import { AuthService } from './application/auth.service.js';
import { SessionGuard } from './guards/session.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthController } from './presentation/auth.controller.js';
import { GetCurrentUserUseCase } from './application/get-current-user.use-case.js';
import { AssignUserRoleUseCase } from './application/assign-user-role.use-case.js';
import { BetterAuthGateway } from './infrastructure/adapters/better-auth.gateway.js';
import { BetterAuthPasswordHasher } from './infrastructure/adapters/better-auth-password-hasher.adapter.js';
import { PasswordHasher } from './application/ports/password-hasher.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      AccountOrmEntity,
      ZoneOrmEntity,
      VerificationOrmEntity,
      AdvisorOrmEntity,
      ClientOrmEntity,
    ]),
    JwtModule.register({}),
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
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    GetCurrentUserUseCase,
    AssignUserRoleUseCase,
    BetterAuthGateway,
    BetterAuthPasswordHasher,
    { provide: PasswordHasher, useExisting: BetterAuthPasswordHasher },
    RedisService,
    AuthTokenService,
    AuthService,
  ],
  exports: [BetterAuthModule, AuthTokenService, SessionGuard, RolesGuard],
})
export class AuthModule {}
