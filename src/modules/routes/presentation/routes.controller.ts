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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { InvalidRouteAdvisorError } from '../domain/errors/invalid-route-advisor.error.js';
import { AuthActor } from '../application/dto/auth-actor.dto.js';

/**
 * HTTP controller for commercial routes (epic E3), the route planning wizard:
 * - Step 1: general data, saved as a draft (HU-17).
 * - Step 2: add, remove and reorder stops, shown on a map (HU-18, HU-19).
 * - Step 3: assign to an advisor and schedule the visits (HU-20).
 * - Supervision: filtered list, detail and soft deactivation (HU-21).
 * - Metrics: distance in km and estimated time (HU-22).
 */
@ApiTags('Routes')
@UseGuards(SessionGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
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

  /** HU-17: create a route in DRAFT (wizard step 1). */
  @Post()
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a route in DRAFT (wizard step 1, HU-17)',
  })
  @ApiResponse({
    status: 201,
    description: 'Ruta creada exitosamente en borrador',
    type: RouteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({
    status: 403,
    description: 'The regional director has no access to that zone',
  })
  @ApiResponse({
    status: 409,
    description: 'A route with that name already exists in the zone',
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

  /** HU-21: list and supervise routes by advisor, zone and status. */
  @Get()
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN, UserRole.ASESOR)
  @ApiOperation({
    summary:
      'List routes filtered by advisor, zone and status, paginated (HU-21). Advisors only see their own routes and directors their zone (HU-06)',
  })
  @ApiResponse({ status: 200, description: 'Paginated route list' })
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

  /** HU-22: preview the metrics of a sequence before saving it. */
  @Post('metrics/calculate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estimate distance and duration for a sequence of clients (HU-22)',
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

  /** HU-19, HU-21: route detail with coordinates for the Leaflet map. */
  @Get(':id')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN, UserRole.ASESOR)
  @ApiOperation({
    summary: 'Route detail with stop coordinates for Leaflet (HU-19, HU-21)',
  })
  @ApiParam({ name: 'id', description: 'Route id' })
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

  /** HU-17, HU-21: update the general data of a route. */
  @Patch(':id')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update the general data of the route (HU-17, HU-21)',
  })
  @ApiParam({ name: 'id', description: 'Route id' })
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

  /** HU-21: toggle active/inactive (soft delete). */
  @Patch(':id/status')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Toggle active/inactive (soft delete) (HU-21)',
  })
  @ApiParam({ name: 'id', description: 'Route id' })
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

  /** HU-18: add a client as a stop (wizard step 2). */
  @Post(':id/stops')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add a client as a stop of the route (wizard step 2, HU-18)',
  })
  @ApiParam({ name: 'id', description: 'Route id' })
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

  /** HU-18: remove a client stop. */
  @Delete(':id/stops/:clientId')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a client stop from the route (HU-18)' })
  @ApiParam({ name: 'id', description: 'Route id' })
  @ApiParam({ name: 'clientId', description: 'Id of the client to remove' })
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

  /** HU-18, HU-19: reorder stops (drag-and-drop and map). */
  @Patch(':id/stops/reorder')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reorder the stops for the map and drag-and-drop (HU-18, HU-19)',
  })
  @ApiParam({ name: 'id', description: 'Route id' })
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
   * HU-20: assign the route to an advisor and schedule the visits in their agenda (wizard step 3).
   */
  @Post(':id/assign')
  @Roles(UserRole.DIRECTOR_REGIONAL, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Assign the route to an advisor and schedule the visits in their agenda (step 3, HU-20)',
  })
  @ApiParam({ name: 'id', description: 'Route id' })
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

  /** Maps domain errors to HTTP exceptions. */
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
      err instanceof InvalidStopOrderError ||
      err instanceof InvalidRouteAdvisorError
    ) {
      throw new BadRequestException(err.message);
    }
    if (err instanceof Error) {
      throw new BadRequestException(err.message);
    }
    throw err;
  }
}
