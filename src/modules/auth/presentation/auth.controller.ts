import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AuthService } from '../application/auth.service.js';
import { BetterAuthGateway } from '../infrastructure/adapters/better-auth.gateway.js';
import { CurrentSession } from '../decorators/current-session.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import { UserRole } from '../domain/user-role.enum.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { VerificationOrmEntity } from '../infrastructure/verification.orm-entity.js';
import { AssignUserRoleDto } from './dto/assign-user-role.dto.js';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password-reset.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AssignUserRoleUseCase } from '../application/assign-user-role.use-case.js';
import { InvalidRoleError } from '../domain/errors/invalid-role.error.js';
import { ZoneRequiredError } from '../domain/errors/zone-required.error.js';
import { UnexpectedZoneError } from '../domain/errors/unexpected-zone.error.js';
import { ZoneNotFoundError } from '../domain/errors/zone-not-found.error.js';
import { UserNotFoundError } from '../domain/errors/user-not-found.error.js';

@ApiTags('Auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly betterAuth: BetterAuthGateway,
    @InjectRepository(VerificationOrmEntity)
    private readonly verificationRepository: Repository<VerificationOrmEntity>,
    private readonly assignUserRoleUseCase: AssignUserRoleUseCase,
  ) {}

  private forwardCookies(
    sourceResponse: globalThis.Response,
    targetResponse: Response,
  ): void {
    const cookies =
      typeof sourceResponse.headers.getSetCookie === 'function'
        ? sourceResponse.headers.getSetCookie()
        : sourceResponse.headers.get('set-cookie');
    if (cookies && (Array.isArray(cookies) ? cookies.length > 0 : true)) {
      targetResponse.setHeader('set-cookie', cookies);
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'JWT access and refresh tokens.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an auth account for an existing advisor or client profile',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created and linked to its commercial profile.',
  })
  @ApiResponse({ status: 409, description: 'The email is already registered.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 200,
    description:
      'The same response is returned whether or not the email exists.',
  })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<{ status: boolean; message: string }> {
    if (!body || typeof body.email !== 'string' || !body.email.trim()) {
      throw new BadRequestException('A valid email address is required');
    }

    const response = await this.betterAuth.requestPasswordReset(
      body.email,
      `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`,
    );
    return {
      status: true,
      message:
        response?.message ??
        'If this email exists in our system, check your email for the reset link',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({
    status: 400,
    description: 'The reset link is invalid, expired, or already used.',
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    if (
      !body ||
      typeof body.token !== 'string' ||
      typeof body.newPassword !== 'string' ||
      body.newPassword.length < 8 ||
      body.newPassword.length > 128
    ) {
      throw new BadRequestException(
        'A valid reset token and a password between 8 and 128 characters are required',
      );
    }
    const verification = await this.verificationRepository.findOneBy({
      identifier: `reset-password:${body.token}`,
    });
    const response = await this.betterAuth.resetPassword(
      body.token,
      body.newPassword,
    );
    if (verification) {
      await this.authService.revokeAllSessions(verification.value);
    }
    return response;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh token and issue a new token pair',
  })
  @ApiResponse({ status: 200, description: 'A new token pair.' })
  @ApiResponse({
    status: 401,
    description: 'The refresh token is invalid or expired.',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current JWT session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  async logout(
    @CurrentUser('id') userId: string,
    @CurrentSession() session: { id: string; authProvider: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (session.authProvider === 'better-auth') {
      const authResponse = await this.betterAuth.signOut(req.headers);
      this.forwardCookies(authResponse, res);
    } else {
      await this.authService.logout(userId, session.id);
    }
    return { success: true, message: 'Session ended successfully' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user and session' })
  @ApiResponse({ status: 200, description: 'Current user and JWT session.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  getMe(
    @CurrentUser() user: UserOrmEntity,
    @CurrentSession() session: { id: string },
  ) {
    return { user, session };
  }

  @Get('protected')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'JWT-protected test endpoint' })
  @ApiResponse({ status: 200, description: 'Access granted.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  protectedEndpoint(@CurrentUser() user: UserOrmEntity) {
    return { message: 'Access granted', user };
  }

  @Patch('users/:userId/role')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign or change a user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid role or zone.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  @ApiResponse({ status: 403, description: 'The Admin role is required.' })
  @ApiResponse({ status: 404, description: 'User or zone not found.' })
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignUserRoleDto,
  ): Promise<{ id: string; role: UserRole; zoneId: number | null }> {
    try {
      return await this.assignUserRoleUseCase.execute({
        userId,
        role: dto.role,
        zoneId: dto.zoneId,
      });
    } catch (error) {
      if (
        error instanceof InvalidRoleError ||
        error instanceof ZoneRequiredError ||
        error instanceof UnexpectedZoneError
      ) {
        throw new BadRequestException(error.message);
      }
      if (
        error instanceof ZoneNotFoundError ||
        error instanceof UserNotFoundError
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
