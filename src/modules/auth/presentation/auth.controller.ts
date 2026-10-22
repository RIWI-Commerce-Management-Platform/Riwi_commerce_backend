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
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AuthService } from '../application/auth.service.js';
import { auth } from '../auth.js';
import { CurrentSession } from '../decorators/current-session.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import { UserRole } from '../domain/user-role.enum.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { SessionGuard } from '../guards/session.guard.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { VerificationOrmEntity } from '../infrastructure/verification.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { AssignUserRoleDto } from './dto/assign-user-role.dto.js';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password-reset.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(ZoneOrmEntity)
    private readonly zoneRepository: Repository<ZoneOrmEntity>,
    @InjectRepository(VerificationOrmEntity)
    private readonly verificationRepository: Repository<VerificationOrmEntity>,
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'JWT access and refresh tokens.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a user and create a JWT session' })
  @ApiResponse({ status: 201, description: 'User and JWT session created.' })
  @ApiResponse({ status: 409, description: 'The email is already registered.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

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
    if (!body || typeof body.email !== 'string') {
      throw new BadRequestException('A valid email address is required');
    }

    const response = await auth.api.requestPasswordReset({
      body: {
        email: body.email,
        redirectTo: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`,
      },
    });
    return {
      status: true,
      message:
        response.message ??
        'If this email exists in our system, check your email for the reset link',
    };
  }

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
    const response = await auth.api.resetPassword({
      body: { token: body.token, newPassword: body.newPassword },
    });
    if (verification) {
      await this.authService.revokeAllSessions(verification.value);
    }
    return response;
  }

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
  @UseGuards(SessionGuard)
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
      const authResponse = await auth.api.signOut({
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });
      this.forwardCookies(authResponse, res);
    } else {
      await this.authService.logout(userId, session.id);
    }
    return { success: true, message: 'Session ended successfully' };
  }

  @Get('me')
  @UseGuards(SessionGuard)
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
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'JWT-protected test endpoint' })
  @ApiResponse({ status: 200, description: 'Access granted.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  protectedEndpoint(@CurrentUser() user: UserOrmEntity) {
    return { message: 'Access granted', user };
  }

  @Patch('users/:userId/role')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  ): Promise<{ id: string; role: UserRole; zoneId: string | null }> {
    if (!Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException('The specified role is invalid');
    }

    let zoneId: string | null = null;
    if (dto.role === UserRole.DIRECTOR_REGIONAL) {
      if (!dto.zoneId || !this.isUuid(dto.zoneId)) {
        throw new BadRequestException(
          'A valid zoneId must be provided for a Regional Director',
        );
      }

      const zone = await this.zoneRepository.findOneBy({ id: dto.zoneId });
      if (!zone) {
        throw new NotFoundException('The specified zone does not exist');
      }
      zoneId = zone.id;
    } else if (dto.zoneId) {
      throw new BadRequestException(
        'Only a Regional Director can be assigned to a zone',
      );
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('The specified user does not exist');
    }

    user.role = dto.role;
    user.zoneId = zoneId;
    await this.userRepository.save(user);

    return { id: user.id, role: user.role, zoneId: user.zoneId };
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
