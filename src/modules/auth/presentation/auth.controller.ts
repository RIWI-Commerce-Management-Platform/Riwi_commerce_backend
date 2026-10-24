import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentSession } from '../decorators/current-session.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { UserRole } from '../domain/user-role.enum.js';
import { AssignUserRoleDto } from './dto/assign-user-role.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginUseCase } from '../application/login.use-case.js';
import { RegisterUseCase } from '../application/register.use-case.js';
import { LogoutUseCase } from '../application/logout.use-case.js';
import { GetCurrentUserUseCase } from '../application/get-current-user.use-case.js';
import { AssignUserRoleUseCase } from '../application/assign-user-role.use-case.js';
import { SetCookieHeaders } from '../application/extract-set-cookies.js';
import { InvalidCredentialsError } from '../domain/errors/invalid-credentials.error.js';
import { RegistrationFailedError } from '../domain/errors/registration-failed.error.js';
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
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly assignUserRoleUseCase: AssignUserRoleUseCase,
  ) {}

  private forwardCookies(
    res: Response,
    setCookieHeaders: SetCookieHeaders,
  ): void {
    if (setCookieHeaders) {
      res.setHeader('set-cookie', setCookieHeaders);
    }
  }

  @Public()
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
      const result = await this.loginUseCase.execute({
        email: dto.email,
        password: dto.password,
        rememberMe: dto.rememberMe ?? false,
        headers: req.headers,
      });
      this.forwardCookies(res, result.setCookieHeaders);
      return result.data;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Public()
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
      const result = await this.registerUseCase.execute({
        name: dto.name,
        email: dto.email,
        password: dto.password,
        headers: req.headers,
      });
      this.forwardCookies(res, result.setCookieHeaders);
      return result.data;
    } catch (error) {
      if (error instanceof RegistrationFailedError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign out and invalidate the active cookie/session',
  })
  @ApiResponse({ status: 200, description: 'Signed out successfully.' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.logoutUseCase.execute(req.headers);
    this.forwardCookies(res, result.setCookieHeaders);

    return {
      success: true,
      message: 'Session ended successfully',
    };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get the current session and user information',
  })
  @ApiResponse({ status: 200, description: 'Active session information.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / No active session.',
  })
  async getMe(@CurrentUser() user: any, @CurrentSession() session: any) {
    try {
      const currentUser = await this.getCurrentUserUseCase.execute(user.id);
      return {
        user: { ...user, role: currentUser.role, zoneId: currentUser.zoneId },
        session,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Get('protected')
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
  @UseGuards(RolesGuard)
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
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AssignUserRoleDto,
  ): Promise<{ id: number; role: UserRole; zoneId: number | null }> {
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
