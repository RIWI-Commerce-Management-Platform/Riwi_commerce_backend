import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { GetDashboardKpisUseCase } from '../application/use-cases/get-dashboard-kpis.use-case.js';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto.js';
import { DashboardKpisResponseDto } from './dto/dashboard-kpis-response.dto.js';
import { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

@ApiTags('Dashboard')
@UseGuards(RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardKpisUseCase: GetDashboardKpisUseCase,
    private readonly currentActor: CurrentActorProvider,
  ) {}

  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR_REGIONAL)
  @ApiOperation({
    summary: 'Weekly commercial KPIs by territory (HU-35)',
    description:
      'Monday–Sunday week in America/Bogota. A regional director always gets their own zone.',
  })
  @ApiForbiddenResponse({ description: 'Only admins and regional directors.' })
  @ApiOkResponse({ type: DashboardKpisResponseDto })
  async getKpis(
    @Query(queryValidationPipe()) filters: DashboardFiltersDto,
    @Req() request: Request,
  ): Promise<DashboardKpisResponseDto> {
    const actor = await this.currentActor.extract(request);
    const kpis = await this.getDashboardKpisUseCase.execute(
      { weekStart: filters.weekStart, territoryId: filters.territoryId },
      actor,
    );
    return new DashboardKpisResponseDto(kpis);
  }
}
