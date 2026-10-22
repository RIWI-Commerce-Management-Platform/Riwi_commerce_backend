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
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { AuthService } from '../application/auth.service.js';
import { CurrentSession } from '../decorators/current-session.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import { UserRole } from '../domain/user-role.enum.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { SessionGuard } from '../guards/session.guard.js';
import { UserOrmEntity } from '../infrastructure/user.orm-entity.js';
import { ZoneOrmEntity } from '../../zones/infrastructure/zone.orm-entity.js';
import { AssignUserRoleDto } from './dto/assign-user-role.dto.js';
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
  ) {}

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
    @CurrentSession('id') sessionId: string,
  ) {
    await this.authService.logout(userId, sessionId);
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
