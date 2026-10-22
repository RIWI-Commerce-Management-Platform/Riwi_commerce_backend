import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth.js';
import { AccountOrmEntity } from './infrastructure/account.orm-entity.js';
import { VerificationOrmEntity } from './infrastructure/verification.orm-entity.js';
import { UserOrmEntity } from './infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../zones/infrastructure/zone.orm-entity.js';
import { RedisService } from './infrastructure/redis.service.js';
import { AuthTokenService } from './application/auth-token.service.js';
import { AuthService } from './application/auth.service.js';
import { SessionGuard } from './guards/session.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthController } from './presentation/auth.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      AccountOrmEntity,
      ZoneOrmEntity,
      VerificationOrmEntity,
    ]),
    JwtModule.register({}),
    BetterAuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    RedisService,
    AuthTokenService,
    AuthService,
    SessionGuard,
    RolesGuard,
  ],
  exports: [BetterAuthModule, SessionGuard, RolesGuard],
})
export class AuthModule {}
