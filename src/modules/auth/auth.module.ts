import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountOrmEntity } from './infrastructure/account.orm-entity.js';
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
    TypeOrmModule.forFeature([UserOrmEntity, AccountOrmEntity, ZoneOrmEntity]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    RedisService,
    AuthTokenService,
    AuthService,
    SessionGuard,
    RolesGuard,
  ],
  exports: [SessionGuard, RolesGuard],
})
export class AuthModule {}
