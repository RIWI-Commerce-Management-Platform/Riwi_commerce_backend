import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  CurrentAdvisorProvider,
} from '../../../../shared/auth/domain/current-advisor.provider.js';
import type { CurrentAdvisorRequest } from '../../../../shared/auth/domain/current-advisor.provider.js';
import { Roles } from '../../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../../auth/domain/user-role.enum.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import { UserOrmEntity } from '../../../auth/infrastructure/user.orm-entity.js';

import { GetVisitAgendaUseCase } from '../../application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from '../../application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from '../../application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from '../../application/use-cases/register-visit-result.use-case.js';

import { VisitAgendaQueryDto } from '../dtos/visit-agenda-query.dto.js';

import { RegisterVisitResultDto } from '../dtos/register-visit-result.dto.js';

import { VisitSummaryResponseDto } from '../dtos/visit-summary-response.dto.js';

import { VisitDetailResponseDto } from '../dtos/visit-detail-response.dto.js';

@ApiTags('Visits')
@ApiUnauthorizedResponse({ description: 'Missing or invalid session.' })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('visits')
@Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
export class VisitsController {
  constructor(
    private readonly getVisitAgenda: GetVisitAgendaUseCase,
    private readonly getVisitById: GetVisitByIdUseCase,
    private readonly startVisit: StartVisitUseCase,
    private readonly registerVisitResult: RegisterVisitResultUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
  ) {}

  @Get('agenda')
  @ApiOperation({
    summary: 'Get the authenticated advisor agenda for a day or a week',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week'],
    description: 'Defaults to day.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: "Reference date in 'YYYY-MM-DD' format. Defaults to today.",
    example: '2026-10-20',
  })
  @ApiResponse({
    status: 200,
    description: 'Visits ordered by scheduled date and time.',
    type: [VisitSummaryResponseDto],
  })
  async getAgenda(
    @Req() request: CurrentAdvisorRequest,
    @Query() query: VisitAgendaQueryDto,
  ): Promise<VisitSummaryResponseDto[]> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visits = await this.getVisitAgenda.execute(
      advisorId,
      query.period ?? 'day',
      query.date,
    );

    return visits.map((visit) => new VisitSummaryResponseDto(visit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visit details for the authenticated advisor' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description:
      'Visit details including client/contact information when available.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Visit not found for this advisor.' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CurrentAdvisorRequest,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.getVisitById.execute(id, advisorId);

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start a pending visit' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description: 'Visit moved to IN_PROGRESS with its actual start time.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Visit is not in the PENDING status.',
  })
  @ApiResponse({ status: 404, description: 'Visit not found for this advisor.' })
  async start(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CurrentAdvisorRequest,
    @CurrentUser() user: UserOrmEntity,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.startVisit.execute(
      id,
      advisorId,
      user.idAsesor ?? user.id,
    );

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/result')
  @ApiOperation({ summary: 'Register the result of an in-progress visit' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description:
      'Visit moved to VISITED with end time, observations and selected results.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid payload, invalid result ids, observations over 500 characters or invalid status transition.',
  })
  @ApiResponse({ status: 404, description: 'Visit not found for this advisor.' })
  async registerResult(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: CurrentAdvisorRequest,
    @Body() body: RegisterVisitResultDto,
    @CurrentUser() user: UserOrmEntity,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.registerVisitResult.execute(
      id,
      advisorId,
      {
        endTime: body.endTime,
        observations: body.observations,
        results: body.results,
      },
      user.idAsesor ?? user.id,
    );

    return new VisitDetailResponseDto(visit);
  }
}
