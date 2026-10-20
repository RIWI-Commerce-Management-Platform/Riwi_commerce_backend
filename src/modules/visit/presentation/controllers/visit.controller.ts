import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  Headers,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';

import { ApiOperation, ApiTags, ApiHeader, ApiParam } from '@nestjs/swagger';

import { GetVisitAgendaUseCase } from '../../application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from '../../application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from '../../application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from '../../application/use-cases/register-visit-result.use-case.js';

import { VisitAgendaQueryDto } from '../dtos/visit-agenda-query.dto.js';

import { RegisterVisitResultDto } from '../dtos/register-visit-result.dto.js';

@ApiTags('Visits')
@Controller('visits')
export class VisitsController {
  constructor(
    private readonly getVisitAgenda: GetVisitAgendaUseCase,
    private readonly getVisitById: GetVisitByIdUseCase,
    private readonly startVisit: StartVisitUseCase,
    private readonly registerVisitResult: RegisterVisitResultUseCase,
  ) {}

  private getAdvisorId(userId?: number): number {
    if (!userId) {
      throw new BadRequestException('Authenticated advisor is required.');
    }

    return userId;
  }

  @Get('agenda')
  @ApiOperation({ summary: 'Get advisor visit agenda' })
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'Temporary local testing header only',
  })
  async getAgenda(
    @Headers('x-user-id') userId: number,
    @Query() query: VisitAgendaQueryDto,
  ) {
    return this.getVisitAgenda.execute(
      this.getAdvisorId(userId),
      query.period ?? 'day',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visit details' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: number,
  ) {
    return this.getVisitById.execute(id, this.getAdvisorId(userId));
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start a visit' })
  async start(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: number,
  ) {
    return this.startVisit.execute(id, this.getAdvisorId(userId));
  }

  @Patch(':id/result')
  @ApiOperation({ summary: 'Register visit result' })
  async registerResult(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: number,
    @Body() body: RegisterVisitResultDto,
  ) {
    return this.registerVisitResult.execute(
      id,
      this.getAdvisorId(userId),
      body,
    );
  }
}
