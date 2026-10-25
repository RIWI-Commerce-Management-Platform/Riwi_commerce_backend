import {
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

import type { Request } from 'express';

import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentAdvisorProvider } from '../../../../shared/auth/domain/current-advisor.provider.js';

import { GetFollowUpAgendaUseCase } from '../../application/use-cases/get-follow-up-agenda.use-case.js';

import { CompleteFollowUpUseCase } from '../../application/use-cases/complete-follow-up.use-case.js';

import { FollowUpAgendaQueryDto } from '../dtos/follow-up-agenda-query.dto.js';

import { FollowUpResponseDto } from '../dtos/follow-up-response.dto.js';

@ApiTags('Follow-ups')
@ApiUnauthorizedResponse({ description: 'No active session.' })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('follow-ups')
export class FollowUpsController {
  constructor(
    private readonly getFollowUpAgenda: GetFollowUpAgendaUseCase,
    private readonly completeFollowUp: CompleteFollowUpUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
  ) {}

  @Get('agenda')
  @ApiOperation({
    summary: 'Follow-ups of the authenticated user for a day or a week (HU-25)',
    description: 'Shown in the agenda next to GET /visits/agenda.',
  })
  @ApiResponse({ status: 200, type: [FollowUpResponseDto] })
  async agenda(
    @Req() request: Request,
    @Query() query: FollowUpAgendaQueryDto,
  ): Promise<FollowUpResponseDto[]> {
    const userId = await this.currentAdvisor.extract(request);

    const followUps = await this.getFollowUpAgenda.execute(
      userId,
      query.period ?? 'day',
      query.date,
      query.status,
    );

    return followUps.map((followUp) => new FollowUpResponseDto(followUp));
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a follow-up as completed (HU-25)' })
  @ApiParam({ name: 'id', description: 'Follow-up ID' })
  @ApiResponse({ status: 200, type: FollowUpResponseDto })
  @ApiResponse({
    status: 400,
    description: 'The follow-up is already completed.',
  })
  @ApiResponse({
    status: 404,
    description: 'Follow-up not found for this user.',
  })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<FollowUpResponseDto> {
    const userId = await this.currentAdvisor.extract(request);

    return new FollowUpResponseDto(
      await this.completeFollowUp.execute(id, userId),
    );
  }
}
