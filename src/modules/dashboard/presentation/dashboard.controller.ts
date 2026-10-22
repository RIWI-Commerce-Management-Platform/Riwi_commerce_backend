
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetDashboardKpisUseCase } from '../application/use-cases/get-dashboard-kpis.use-case.js';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

@ApiTags('Dashboard')
@Controller('dashboard')
@Roles(UserRole.ADMINISTRADOR)
export class DashboardController {
  constructor(
    private readonly getDashboardKpisUseCase: GetDashboardKpisUseCase,
  ) {}

  @Get('kpis')
  @ApiOperation({
    summary: 'Get weekly commercial dashboard KPIs',
  })
  async getKpis(@Query() filters: DashboardFiltersDto) {
    return this.getDashboardKpisUseCase.execute({
      weekStart: filters.weekStart,
      territoryId: filters.parsedTerritoryId,
    });
  }
}
