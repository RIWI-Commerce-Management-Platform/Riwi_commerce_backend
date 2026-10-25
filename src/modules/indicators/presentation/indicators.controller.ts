import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { GetWeeklyGoalUseCase } from '../application/get-weekly-goal.use-case.js';
import {
  GetIndicatorsUseCase,
  IndicatorsInput,
} from '../application/get-indicators.use-case.js';
import { IndicatorsQueryDto } from './dto/indicators-query.dto.js';
import { WeeklyGoalQueryDto } from './dto/weekly-goal-query.dto.js';
import {
  AdvisorIndicatorResponseDto,
  WeeklyGoalResponseDto,
  ZoneIndicatorResponseDto,
} from './dto/indicator-response.dto.js';
import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { CurrentActorProvider } from '../../../shared/auth/domain/current-actor.provider.js';
import { queryValidationPipe } from '../../../shared/pagination/query-validation.pipe.js';
import {
  endOfDay,
  startOfDay,
} from '../../../shared/pagination/date-range-query.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

@ApiTags('Indicators')
@UseGuards(RolesGuard)
@Controller('indicators')
export class IndicatorsController {
  constructor(
    private readonly getWeeklyGoalUseCase: GetWeeklyGoalUseCase,
    private readonly getIndicatorsUseCase: GetIndicatorsUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
    private readonly currentActor: CurrentActorProvider,
  ) {}

  @Get('weekly-goal')
  @ApiOperation({
    summary: 'Weekly goal progress of the authenticated advisor (HU-39)',
    description:
      "Sidebar widget: goal, completed visits and progress. The goal is the advisor's weeklyVisitGoal or, without one, the visits scheduled for the week.",
  })
  @ApiOkResponse({ type: WeeklyGoalResponseDto })
  async weeklyGoal(
    @Query(queryValidationPipe()) query: WeeklyGoalQueryDto,
    @Req() request: Request,
  ): Promise<WeeklyGoalResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);
    return new WeeklyGoalResponseDto(
      await this.getWeeklyGoalUseCase.execute(
        advisorId,
        startOfDay(query.date) ?? new Date(),
      ),
    );
  }

  @Get('by-advisor')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR_REGIONAL)
  @ApiOperation({
    summary: 'Effectiveness and quoted value per advisor (HU-40)',
  })
  @ApiForbiddenResponse({ description: 'Only admins and regional directors.' })
  @ApiOkResponse({ type: [AdvisorIndicatorResponseDto] })
  async byAdvisor(
    @Query(queryValidationPipe()) query: IndicatorsQueryDto,
    @Req() request: Request,
  ): Promise<AdvisorIndicatorResponseDto[]> {
    const actor = await this.currentActor.extract(request);
    const rows = await this.getIndicatorsUseCase.byAdvisor(
      this.toInput(query),
      actor,
    );
    return rows.map((row) => new AdvisorIndicatorResponseDto(row));
  }

  @Get('by-zone')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR_REGIONAL)
  @ApiOperation({ summary: 'Effectiveness and quoted value per zone (HU-40)' })
  @ApiForbiddenResponse({ description: 'Only admins and regional directors.' })
  @ApiOkResponse({ type: [ZoneIndicatorResponseDto] })
  async byZone(
    @Query(queryValidationPipe()) query: IndicatorsQueryDto,
    @Req() request: Request,
  ): Promise<ZoneIndicatorResponseDto[]> {
    const actor = await this.currentActor.extract(request);
    const rows = await this.getIndicatorsUseCase.byZone(
      this.toInput(query),
      actor,
    );
    return rows.map((row) => new ZoneIndicatorResponseDto(row));
  }

  /** Defaults to the current month. */
  private toInput(query: IndicatorsQueryDto): IndicatorsInput {
    const now = new Date();
    return {
      startDate:
        startOfDay(query.from) ??
        new Date(now.getFullYear(), now.getMonth(), 1),
      endDate:
        endOfDay(query.to) ??
        new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      zoneId: query.zoneId,
    };
  }
}
