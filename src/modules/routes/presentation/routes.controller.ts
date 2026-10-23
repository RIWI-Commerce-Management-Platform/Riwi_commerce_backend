import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRouteDraftDto } from './dto/create-route-draft.dto.js';
import { UpdateRouteDraftDto } from './dto/update-route-draft.dto.js';
import { AddRouteStopDto } from './dto/add-route-stop.dto.js';
import { ReorderRouteStopsDto } from './dto/reorder-route-stops.dto.js';
import { AssignRouteAdvisorDto } from './dto/assign-route-advisor.dto.js';
import { CalculateMetricsDto } from './dto/calculate-metrics.dto.js';
import { FindRoutesQueryDto } from './dto/find-routes-query.dto.js';
import {
  RouteMetricsResponseDto,
  RouteResponseDto,
} from './dto/route-response.dto.js';
import { CreateRouteDraftUseCase } from '../application/create-route-draft.use-case.js';
import { UpdateRouteDraftUseCase } from '../application/update-route-draft.use-case.js';
import { AddRouteStopUseCase } from '../application/add-route-stop.use-case.js';
import { RemoveRouteStopUseCase } from '../application/remove-route-stop.use-case.js';
import { ReorderRouteStopsUseCase } from '../application/reorder-route-stops.use-case.js';
import { AssignRouteAdvisorUseCase } from '../application/assign-route-advisor.use-case.js';
import { CalculateRouteMetricsUseCase } from '../application/calculate-route-metrics.use-case.js';
import { FindRoutesUseCase } from '../application/find-routes.use-case.js';
import { GetRouteByIdUseCase } from '../application/get-route-by-id.use-case.js';
import { ToggleRouteStatusUseCase } from '../application/toggle-route-status.use-case.js';
import { SessionGuard } from '../../auth/guards/session.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';
import { RouteNotFoundError } from '../domain/errors/route-not-found.error.js';
import { RouteNameAlreadyExistsError } from '../domain/errors/route-name-already-exists.error.js';
import { UnauthorizedZoneError } from '../domain/errors/unauthorized-zone.error.js';
import { RouteHasNoStopsError } from '../domain/errors/route-has-no-stops.error.js';
import { ClientAlreadyInRouteError } from '../domain/errors/client-already-in-route.error.js';
import { ClientNotInRouteError } from '../domain/errors/client-not-in-route.error.js';
import { InvalidStopOrderError } from '../domain/errors/invalid-stop-order.error.js';
import { AuthActor } from '../application/dto/auth-actor.dto.js';

/**
 * Controlador HTTP para la gestión integral de Rutas Comerciales (Épica E3).
 *
 * En mi controlador expongo las operaciones REST para el Wizard de planeación de rutas:
 * - Paso 1: Creación de datos generales y borrador (HU-17).
 * - Paso 2: Agregar, remover y reordenar paradas con visualización en mapa (HU-18 y HU-19).
 * - Paso 3: Asignar a un asesor comercial y generar visitas programadas (HU-20).
 * - Supervisión: Listado con filtros, detalle e inactivación lógica (HU-21).
 * - Métricas: Resumen logístico de distancia en km y tiempo estimado (HU-22).
 */
@ApiTags('Routes')
@ApiBearerAuth()
@UseGuards(SessionGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(
    private readonly createRouteDraftUseCase: CreateRouteDraftUseCase,
    private readonly updateRouteDraftUseCase: UpdateRouteDraftUseCase,
    private readonly addRouteStopUseCase: AddRouteStopUseCase,
    private readonly removeRouteStopUseCase: RemoveRouteStopUseCase,
    private readonly reorderRouteStopsUseCase: ReorderRouteStopsUseCase,
    private readonly assignRouteAdvisorUseCase: AssignRouteAdvisorUseCase,
    private readonly calculateRouteMetricsUseCase: CalculateRouteMetricsUseCase,
    private readonly findRoutesUseCase: FindRoutesUseCase,
    private readonly getRouteByIdUseCase: GetRouteByIdUseCase,
    private readonly toggleRouteStatusUseCase: ToggleRouteStatusUseCase,
  ) {}

  /**
   * HU-17: Crear una ruta en estado borrador (Paso 1 del Wizard).
   */
  @Post()
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Crear una ruta comercial en estado borrador (Paso 1 del Wizard - HU-17)',
  })
  @ApiResponse({
    status: 201,
    description: 'Ruta creada exitosamente en borrador',
    type: RouteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({
    status: 403,
    description:
      'El Director Regional no tiene permisos sobre la zona especificada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una ruta con ese nombre en la misma zona',
  })
  async createDraft(
    @Body() dto: CreateRouteDraftDto,
    @CurrentUser() user: any,
  ): Promise<RouteResponseDto> {
    try {
      const actor: AuthActor = {
        id: user.id,
        role: user.role,
        zoneId: user.zoneId,
      };

      const route = await this.createRouteDraftUseCase.execute(
        {
          name: dto.name,
          description: dto.description,
          zoneId: dto.zoneId,
          dayOfWeek: dto.dayOfWeek,
          frequency: dto.frequency,
          startTime: dto.startTime,
          endTime: dto.endTime,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        },
        actor,
      );

      return RouteResponseDto.fromDomain(route);
    } catch (err) {
      this._handleDomainError(err);
    }
  }

  /**
   * HU-21: Listar y supervisar rutas con filtros por asesor, zona y estado.
   */
  @Get()
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN, UserRole.ASESOR)
  @ApiOperation({
    summary:
      'Listar rutas con filtros por asesor, zona y estado con paginación (HU-21)',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de rutas' })
  async findPaginated(
    @Query() query: FindRoutesQueryDto,
    @CurrentUser() user: any,
  ) {
    const actor: AuthActor = {
      id: user.id,
      role: user.role,
      zoneId: user.zoneId,
    };

    const result = await this.findRoutesUseCase.execute(
      {
        page: query.parsedPage,
        limit: query.parsedLimit,
        zoneId: query.zoneId,
        advisorId: query.advisorId,
        status: query.status,
        dayOfWeek: query.dayOfWeek,
        frequency: query.frequency,
        isActive: query.isActive,
        search: query.search,
      },
      actor,
    );

    return {
      data: result.data.map((route) => RouteResponseDto.fromDomain(route)),
      meta: result.meta,
    };
  }

  /**
   * HU-22: Previsualizar el cálculo de métricas de un recorrido antes de guardar.
   */
  @Post('metrics/calculate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Calcular distancia y duración estimada para una secuencia de clientes (HU-22)',
  })
  @ApiResponse({ status: 200, type: RouteMetricsResponseDto })
  async calculateMetrics(
    @Body() dto: CalculateMetricsDto,
  ): Promise<RouteMetricsResponseDto> {
    const metrics = await this.calculateRouteMetricsUseCase.execute({
      clientIds: dto.clientIds,
      stopDurationMinutes: dto.stopDurationMinutes,
    });
    return metrics;
  }

  /**
   * HU-19 y HU-21: Obtener el detalle de una ruta con coordenadas para pintar en mapa Leaflet.
   */
  @Get(':id')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN, UserRole.ASESOR)
  @ApiOperation({
    summary:
      'Obtener detalle de ruta con coordenadas de paradas para Leaflet (HU-19 y HU-21)',
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, type: RouteResponseDto })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<RouteResponseDto> {
    try {
      const actor: AuthActor = {
        id: user.id,
        role: user.role,
        zoneId: user.zoneId,
      };

      const details = await this.getRouteByIdUseCase.execute(id, actor);
      return RouteResponseDto.fromEnrichedDetails(details);
    } catch (err) {
      this._handleDomainError(err);
    }
  }

  /**
   * HU-17 y HU-21: Actualizar datos generales de una ruta comercial.
   */
  @Patch(':id')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Actualizar datos generales de la ruta (HU-17 y HU-21)',
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, type: RouteResponseDto })
  async updateDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRouteDraftDto,
    @CurrentUser() user: any,
  ): Promise<RouteResponseDto> {
    try {
      const actor: AuthActor = {
        id: user.id,
        role: user.role,
        zoneId: user.zoneId,
      };

      const route = await this.updateRouteDraftUseCase.execute(
        id,
        {
          name: dto.name,
          description: dto.description,
          zoneId: dto.zoneId,
          dayOfWeek: dto.dayOfWeek,
          frequency: dto.frequency,
          startTime: dto.startTime,
          endTime: dto.endTime,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        },
        actor,
      );

      return RouteResponseDto.fromDomain(route);
    } catch (err) {
      this._handleDomainError(err);
    }
  }

  /**
   * HU-21: Alternar estado activo / inactivo de la ruta (Soft delete).
   */
  @Patch(':id/status')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo (Soft delete) (HU-21)',
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, type: RouteResponseDto })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<RouteResponseDto> {
    try {
      const actor: AuthActor = {
        id: user.id,
        role: user.role,
        zoneId: user.zoneId,
      };

      const route = await this.toggleRouteStatusUseCase.execute(id, actor);
      return RouteResponseDto.fromDomain(route);
    } catch (err) {
      this._handleDomainError(err);
    }
  }

  /**
   * HU-18: Agregar un cliente como parada a la ruta (Paso 2 del Wizard).
   */
  @Post(':id/stops')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Agregar un cliente como parada a la ruta (Paso 2 del Wizard - HU-18)',
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 201, type: RouteResponseDto })
  async addStop(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddRouteStopDto,
    @CurrentUser() user: any,
  ): Promise<RouteResponseDto> {
    try {
      const actor: AuthActor = {
        id: user.id,
        role: user.role,
        zoneId: user.zoneId,
      };

      const route = await this.addRouteStopUseCase.execute(
        id,
        {
          clientId: dto.clientId,
          suggestedTime: dto.suggestedTime,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
        },
        actor,
      );

      return RouteResponseDto.fromDomain(route);
    } catch (err) {
      this._handleDomainError(err);
    }
  }

  /**
   * HU-18: Remover una parada de cliente de la ruta.
   */
  @Delete(':id/stops/:clientId')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover una parada de cliente de la ruta (HU-18)' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiParam({ name: 'clientId', description: 'ID del cliente a remover' })
  @ApiResponse({ status: 200, type: RouteResponseDto })
  async removeStop(
    @Param('id', ParseIntPipe) id: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @CurrentUser() user: any,
  ): Promise<RouteResponseDto> {
    try {
      const actor: AuthActor = {
        id: user.id,
        role: user.role,
        zoneId: user.zoneId,
      };

      const route = await this.removeRouteStopUseCase.execute(
        id,
        clientId,
        actor,
      );
      return RouteResponseDto.fromDomain(route);
    } catch (err) {
      this._handleDomainError(err);
    }
  }

  /**
   * HU-18 y HU-19: Reordenar paradas (soporte drag-and-drop y mapa interactivo).
   */
  @Patch(':id/stops/reorder')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Reordenar paradas para el mapa interactivo y drag-and-drop (HU-18 y HU-19)',
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, type: RouteResponseDto })
  async reorderStops(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderRouteStopsDto,
    @CurrentUser() user: any,
  ): Promise<RouteResponseDto> {
    try {
      const actor: AuthActor = {
        id: user.id,
        role: user.role,
        zoneId: user.zoneId,
      };

      const route = await this.reorderRouteStopsUseCase.execute(
        id,
        dto.orderedClientIds,
        actor,
      );

      return RouteResponseDto.fromDomain(route);
    } catch (err) {
      this._handleDomainError(err);
    }
  }

  /**
   * HU-20: Asignar ruta a un asesor comercial y programar visitas en su agenda (Paso 3 del Wizard).
   */
  @Post(':id/assign')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Asignar ruta a asesor y programar visitas en su agenda (Paso 3 - HU-20)',
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, type: RouteResponseDto })
  async assignAdvisor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRouteAdvisorDto,
    @CurrentUser() user: any,
  ): Promise<RouteResponseDto> {
    try {
      const actor: AuthActor = {
        id: user.id,
        role: user.role,
        zoneId: user.zoneId,
      };

      const route = await this.assignRouteAdvisorUseCase.execute(
        id,
        dto.advisorId,
        actor,
      );

      return RouteResponseDto.fromDomain(route);
    } catch (err) {
      this._handleDomainError(err);
    }
  }

  /**
   * Traductor de excepciones de dominio a códigos de respuesta HTTP de NestJS.
   */
  private _handleDomainError(err: unknown): never {
    if (
      err instanceof RouteNotFoundError ||
      err instanceof ClientNotInRouteError
    ) {
      throw new NotFoundException(err.message);
    }
    if (err instanceof RouteNameAlreadyExistsError) {
      throw new ConflictException(err.message);
    }
    if (err instanceof UnauthorizedZoneError) {
      throw new ForbiddenException(err.message);
    }
    if (
      err instanceof RouteHasNoStopsError ||
      err instanceof ClientAlreadyInRouteError ||
      err instanceof InvalidStopOrderError
    ) {
      throw new BadRequestException(err.message);
    }
    if (err instanceof Error) {
      throw new BadRequestException(err.message);
    }
    throw err;
  }
}
