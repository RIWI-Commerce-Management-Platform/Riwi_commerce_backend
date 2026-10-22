import {
  Body,
  BadRequestException,
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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { Repository } from 'typeorm';
import { auth } from '../auth.js';
import { CurrentSession } from '../decorators/current-session.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import { SessionGuard } from '../guards/session.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { UserRole } from '../domain/user-role.enum.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { AssignUserRoleDto } from './dto/assign-user-role.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(ZoneOrmEntity)
    private readonly zoneRepository: Repository<ZoneOrmEntity>,
  ) {}

  /**
   * Helper to forward Set-Cookie headers from Better Auth response to Express response.
   */
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
  @ApiResponse({
    status: 200,
    description: 'Signed in successfully. A session cookie has been set.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials (incorrect email or password).',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const authResponse = await auth.api.signInEmail({
        body: {
          email: dto.email,
          password: dto.password,
          rememberMe: dto.rememberMe ?? false,
        },
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });

      this.forwardCookies(authResponse, res);

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        throw new UnauthorizedException(
          errorData?.message ||
            errorData?.statusText ||
            'Incorrect email or password',
        );
      }

      const data = await authResponse.json();
      return data;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        error?.body?.message || error?.message || 'Incorrect email or password',
      );
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered and signed in automatically.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or the user already exists.',
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const authResponse = await auth.api.signUpEmail({
        body: {
          name: dto.name,
          email: dto.email,
          password: dto.password,
        },
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });

      this.forwardCookies(authResponse, res);

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        throw new BadRequestException(
          errorData?.message ||
            errorData?.statusText ||
            'Failed to register user',
        );
      }

      const data = await authResponse.json();
      return data;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error?.body?.message || error?.message || 'Failed to register user',
      );
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign out and invalidate the active cookie/session',
  })
  @ApiResponse({ status: 200, description: 'Signed out successfully.' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const authResponse = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    this.forwardCookies(authResponse, res);

    return {
      success: true,
      message: 'Session ended successfully',
    };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @ApiOperation({
    summary: 'Get the current session and user information',
  })
  @ApiResponse({ status: 200, description: 'Active session information.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / No active session.',
  })
  async getMe(@CurrentUser() user: any, @CurrentSession() session: any) {
    const currentUser = await this.userRepository.findOne({
      where: { id: user.id },
      select: { id: true, role: true, zoneId: true },
    });
    if (!currentUser) {
      throw new UnauthorizedException('Unauthorized: user does not exist');
    }

    return {
      user: { ...user, role: currentUser.role, zoneId: currentUser.zoneId },
      session,
    };
  }

  @Get('protected')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Session-guarded test endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Authorized to access the protected resource.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: session is missing or invalid.',
  })
  protectedEndpoint(@CurrentUser() user: any) {
    return {
      message: 'Access granted',
      user,
    };
  }

  @Patch('users/:userId/role')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Assign or change a user role (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid role or zone.' })
  @ApiResponse({ status: 401, description: 'No active session.' })
  @ApiResponse({ status: 403, description: 'The Admin role is required.' })
  @ApiResponse({ status: 404, description: 'User or zone not found.' })
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignUserRoleDto,
  ): Promise<{ id: string; role: UserRole; zoneId: number | null }> {
    if (!Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException('The specified role is invalid');
    }

    let zoneId: number | null = null;
    if (dto.role === UserRole.DIRECTOR_REGIONAL) {
      if (!dto.zoneId || !Number.isInteger(dto.zoneId)) {
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
}
