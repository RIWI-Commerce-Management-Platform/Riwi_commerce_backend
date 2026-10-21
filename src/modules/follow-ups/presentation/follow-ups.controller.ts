import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentAdvisorProvider } from '../../../shared/auth/domain/current-advisor.provider.js';
import { CreateFollowUpUseCase } from '../application/create-follow-up.use-case.js';
import { CompleteFollowUpUseCase } from '../application/complete-follow-up.use-case.js';
import { ListFollowUpsUseCase } from '../application/list-follow-ups.use-case.js';
import { CreateFollowUpDto } from './dto/create-follow-up.dto.js';
import { FollowUpResponseDto } from './dto/follow-up-response.dto.js';

@ApiTags('Follow-ups')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  description: 'TEMPORARY advisor id header. Will be replaced by Better Auth.',
})
@ApiUnauthorizedResponse({ description: 'Missing or invalid advisor header.' })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('follow-ups')
export class FollowUpsController {
  constructor(
    private readonly createFollowUpUseCase: CreateFollowUpUseCase,
    private readonly completeFollowUpUseCase: CompleteFollowUpUseCase,
    private readonly listFollowUpsUseCase: ListFollowUpsUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
  ) {}

  @Get('visits/:visitId')
  @ApiOperation({ summary: 'List follow-ups for an authorized visit' })
  @ApiParam({ name: 'visitId', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description: 'Follow-up list for the visit and its advisor.',
    type: [FollowUpResponseDto],
  })
  async listByVisit(
    @Param('visitId', ParseIntPipe) visitId: number,
    @Req() request: Request,
  ): Promise<FollowUpResponseDto[]> {
    const advisorId = await this.currentAdvisor.extract(request);
    const followUps = await this.listFollowUpsUseCase.execute(
      visitId,
      advisorId,
    );

    return followUps.map((followUp) => new FollowUpResponseDto(followUp));
  }

  @Get('agenda')
  @ApiOperation({
    summary: 'List pending follow-ups for the current advisor agenda',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: "Reference date in 'YYYY-MM-DD' format. Defaults to today.",
    example: '2026-10-20',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week'],
    description: 'Defaults to day.',
  })
  @ApiResponse({
    status: 200,
    description: 'Follow-ups that are still pending for the advisor.',
    type: [FollowUpResponseDto],
  })
  async agenda(
    @Req() request: Request,
    @Query('date') date?: string,
    @Query('period') period?: 'day' | 'week',
  ): Promise<FollowUpResponseDto[]> {
    const advisorId = await this.currentAdvisor.extract(request);
    const followUps = await this.listFollowUpsUseCase.getAgenda(
      advisorId,
      date,
      period ?? 'day',
    );

    return followUps.map((followUp) => new FollowUpResponseDto(followUp));
  }

  @Post('visits/:visitId')
  @ApiOperation({ summary: 'Create a follow-up for a visit' })
  @ApiParam({ name: 'visitId', description: 'Visit ID' })
  @ApiResponse({
    status: 201,
    description: 'Follow-up created successfully.',
    type: FollowUpResponseDto,
  })
  async create(
    @Param('visitId', ParseIntPipe) visitId: number,
    @Req() request: Request,
    @Body() body: CreateFollowUpDto,
  ): Promise<FollowUpResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);
    const followUp = await this.createFollowUpUseCase.execute(
      visitId,
      advisorId,
      body,
    );
    return new FollowUpResponseDto(followUp);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a follow-up as completed' })
  @ApiParam({ name: 'id', description: 'Follow-up ID' })
  @ApiResponse({
    status: 200,
    description: 'Follow-up marked as completed.',
    type: FollowUpResponseDto,
  })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<FollowUpResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);
    const followUp = await this.completeFollowUpUseCase.execute(id, advisorId);
    return new FollowUpResponseDto(followUp);
  }
}
