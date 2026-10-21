import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';
import { CurrentSession } from '../decorators/current-session.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { SessionGuard } from '../guards/session.guard.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  /**
   * Helper to forward Set-Cookie headers from Better Auth response to Express response.
   */
  private forwardCookies(sourceResponse: globalThis.Response, targetResponse: Response): void {
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
    description: 'Sesión iniciada correctamente. Se establece la cookie de sesión.',
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
          errorData?.message || errorData?.statusText || 'Correo o contraseña incorrectos',
        );
      }

      const data = await authResponse.json();
      return data;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        error?.body?.message || error?.message || 'Correo o contraseña incorrectos',
      );
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario con correo y contraseña' })
  @ApiResponse({ status: 201, description: 'Usuario registrado e inicio de sesión automático.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o el usuario ya existe.' })
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
          errorData?.message || errorData?.statusText || 'Error al registrar el usuario',
        );
      }

      const data = await authResponse.json();
      return data;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error?.body?.message || error?.message || 'Error al registrar el usuario',
      );
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión e invalidar la cookie/sesión activa' })
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
  @ApiOperation({ summary: 'Obtener información de la sesión y usuario actual' })
  @ApiResponse({ status: 200, description: 'Información de la sesión activa.' })
  @ApiResponse({ status: 401, description: 'No autorizado / Sesión no iniciada.' })
  getMe(@CurrentUser() user: any, @CurrentSession() session: any) {
    return {
      user,
      session,
    };
  }

  @Get('protected')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Endpoint de prueba protegido por Guard de sesión' })
  @ApiResponse({ status: 200, description: 'Acceso autorizado al recurso protegido.' })
  @ApiResponse({ status: 401, description: 'No autorizado: falta sesión o sesión inválida.' })
  protectedEndpoint(@CurrentUser() user: any) {
    return {
      message: 'Acceso autorizado',
      user,
    };
  }
}
