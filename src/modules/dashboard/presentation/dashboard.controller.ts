
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetDashboardKpisUseCase } from '../application/use-cases/get-dashboard-kpis.use-case.js';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto.js';

@ApiTags('Dashboard')
@Controller('dashboard')
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
      territoryId: filters.territoryId,
    });
  }
}
