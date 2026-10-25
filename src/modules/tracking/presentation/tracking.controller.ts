import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ListTrackingVisitsUseCase } from '../application/use-cases/list-tracking-visits.use-case.js';
import { TrackingVisitsQueryDto } from './dto/tracking-visits-query.dto.js';
import { TrackingVisitsResponseDto } from './dto/tracking-visits-response.dto.js';
import { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

@ApiTags('Tracking')
@UseGuards(RolesGuard)
@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly listTrackingVisitsUseCase: ListTrackingVisitsUseCase,
    private readonly currentActor: CurrentActorProvider,
  ) {}

  @Get('visits')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR_REGIONAL)
  @ApiOperation({
    summary: 'Route and visit tracking table, paginated (HU-37)',
    description:
      'One row per visit scheduled in the week (Monday–Sunday, America/Bogota). A regional director always gets their own zone.',
  })
  @ApiOkResponse({ type: TrackingVisitsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid filters.' })
  @ApiUnauthorizedResponse({ description: 'No session.' })
  @ApiForbiddenResponse({ description: 'Only admins and regional directors.' })
  async listVisits(
    @Query(queryValidationPipe()) query: TrackingVisitsQueryDto,
    @Req() request: Request,
  ): Promise<TrackingVisitsResponseDto> {
    const actor = await this.currentActor.extract(request);
    const page = await this.listTrackingVisitsUseCase.execute(
      {
        weekStart: query.weekStart,
        territoryId: query.territoryId,
        advisorId: query.advisorId,
        routeId: query.routeId,
        status: query.status,
        page: query.parsedPage,
        limit: query.parsedLimit,
        order: query.order ?? 'asc',
      },
      actor,
    );
    return new TrackingVisitsResponseDto(page);
  }
}
