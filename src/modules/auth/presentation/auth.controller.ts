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
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiResponse({
    status: 200,
    description:
      'Sesión iniciada correctamente. Se establece la cookie de sesión.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas (correo o contraseña incorrectos).',
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
            'Correo o contraseña incorrectos',
        );
      }

      const data = await authResponse.json();
      return data;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        error?.body?.message ||
          error?.message ||
          'Correo o contraseña incorrectos',
      );
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo usuario con correo y contraseña',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado e inicio de sesión automático.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el usuario ya existe.',
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
            'Error al registrar el usuario',
        );
      }

      const data = await authResponse.json();
      return data;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error?.body?.message ||
          error?.message ||
          'Error al registrar el usuario',
      );
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión e invalidar la cookie/sesión activa',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente.' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const authResponse = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    this.forwardCookies(authResponse, res);

    return {
      success: true,
      message: 'Sesión finalizada exitosamente',
    };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @ApiOperation({
    summary: 'Obtener información de la sesión y usuario actual',
  })
  @ApiResponse({ status: 200, description: 'Información de la sesión activa.' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado / Sesión no iniciada.',
  })
  async getMe(@CurrentUser() user: any, @CurrentSession() session: any) {
    const currentUser = await this.userRepository.findOne({
      where: { id: user.id },
      select: { id: true, role: true, zoneId: true },
    });
    if (!currentUser) {
      throw new UnauthorizedException('No autorizado: usuario inexistente');
    }

    return {
      user: { ...user, role: currentUser.role, zoneId: currentUser.zoneId },
      session,
    };
  }

  @Get('protected')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Endpoint de prueba protegido por Guard de sesión' })
  @ApiResponse({
    status: 200,
    description: 'Acceso autorizado al recurso protegido.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado: falta sesión o sesión inválida.',
  })
  protectedEndpoint(@CurrentUser() user: any) {
    return {
      message: 'Acceso autorizado',
      user,
    };
  }

  @Patch('users/:userId/role')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Asignar o cambiar el rol de un usuario (solo Admin)',
  })
  @ApiResponse({ status: 200, description: 'Rol actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'Rol o zona inválidos.' })
  @ApiResponse({ status: 401, description: 'Sesión no iniciada.' })
  @ApiResponse({ status: 403, description: 'Se requiere el rol Admin.' })
  @ApiResponse({ status: 404, description: 'Usuario o zona no encontrados.' })
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignUserRoleDto,
  ): Promise<{ id: string; role: UserRole; zoneId: string | null }> {
    if (!Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException('El rol indicado no es válido');
    }

    let zoneId: string | null = null;
    if (dto.role === UserRole.DIRECTOR_REGIONAL) {
      if (!dto.zoneId || !this.isUuid(dto.zoneId)) {
        throw new BadRequestException(
          'Debe indicar un zoneId válido para el Director Regional',
        );
      }

      const zone = await this.zoneRepository.findOneBy({ id: dto.zoneId });
      if (!zone) {
        throw new NotFoundException('La zona indicada no existe');
      }
      zoneId = zone.id;
    } else if (dto.zoneId) {
      throw new BadRequestException(
        'Solo un Director Regional puede tener una zona asignada',
      );
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('El usuario indicado no existe');
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
