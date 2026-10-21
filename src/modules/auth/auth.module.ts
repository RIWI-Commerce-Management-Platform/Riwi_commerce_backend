import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth.js';
import { SessionGuard } from './guards/session.guard.js';
import { AuthController } from './presentation/auth.controller.js';

@Module({
  imports: [
    BetterAuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
  ],
  controllers: [AuthController],
  providers: [SessionGuard],
  exports: [BetterAuthModule, SessionGuard],
})
export class AuthModule {}
