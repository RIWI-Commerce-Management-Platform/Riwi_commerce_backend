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
import { GetVisitMapUseCase } from '../application/use-cases/get-visit-map.use-case.js';
import { VisitMapQueryDto } from './dto/visit-map-query.dto.js';
import { VisitMapResponseDto } from './dto/visit-map-response.dto.js';
import { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

@ApiTags('Visit map')
@UseGuards(RolesGuard)
@Controller('visit-map')
export class VisitMapController {
  constructor(
    private readonly getVisitMapUseCase: GetVisitMapUseCase,
    private readonly currentActor: CurrentActorProvider,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR_REGIONAL)
  @ApiOperation({
    summary: 'Visits of a day with coordinates and legend category (HU-36)',
    description:
      'Markers for the Leaflet map. A regional director always gets their own zone.',
  })
  @ApiOkResponse({ type: VisitMapResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid filters.' })
  @ApiUnauthorizedResponse({ description: 'No session.' })
  @ApiForbiddenResponse({ description: 'Only admins and regional directors.' })
  async getMap(
    @Query(queryValidationPipe()) query: VisitMapQueryDto,
    @Req() request: Request,
  ): Promise<VisitMapResponseDto> {
    const actor = await this.currentActor.extract(request);
    const map = await this.getVisitMapUseCase.execute(
      {
        date: query.date,
        territoryId: query.territoryId,
        advisorId: query.advisorId,
      },
      actor,
    );
    return new VisitMapResponseDto(map);
  }
}
