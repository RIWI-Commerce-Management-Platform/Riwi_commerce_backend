import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { TypeOrmModule } from '@nestjs/typeorm';
import { auth } from './auth.js';
import { UserOrmEntity } from './infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../zones/infrastructure/zone.orm-entity.js';
import { SessionGuard } from './guards/session.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthController } from './presentation/auth.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, ZoneOrmEntity]),
    BetterAuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
  ],
  controllers: [AuthController],
  providers: [SessionGuard, RolesGuard],
  exports: [BetterAuthModule, SessionGuard, RolesGuard],
})
export class AuthModule {}
