import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import type { Request } from 'express';

import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentAdvisorProvider } from '../../../../shared/auth/domain/current-advisor.provider.js';

import { GetVisitAgendaUseCase } from '../../application/use-cases/get-visit-agenda.use-case.js';

import { GetVisitByIdUseCase } from '../../application/use-cases/get-visit-by-id.use-case.js';

import { StartVisitUseCase } from '../../application/use-cases/start-visit.use-case.js';

import { RegisterVisitResultUseCase } from '../../application/use-cases/register-visit-result.use-case.js';

import { VisitAgendaQueryDto } from '../dtos/visit-agenda-query.dto.js';

import { RegisterVisitResultDto } from '../dtos/register-visit-result.dto.js';

import { VisitSummaryResponseDto } from '../dtos/visit-summary-response.dto.js';

import { VisitDetailResponseDto } from '../dtos/visit-detail-response.dto.js';

import { RescheduleVisitUseCase } from '../../application/use-cases/reschedule-visit.use-case.js';

import { MarkVisitNotVisitedUseCase } from '../../application/use-cases/mark-visit-not-visited.use-case.js';

import { RegisterCommercialOutcomeUseCase } from '../../application/use-cases/register-commercial-outcome.use-case.js';

import { CreateFollowUpUseCase } from '../../application/use-cases/create-follow-up.use-case.js';

import { UploadVisitAttachmentUseCase } from '../../application/use-cases/upload-visit-attachment.use-case.js';

import { ListVisitAttachmentsUseCase } from '../../application/use-cases/list-visit-attachments.use-case.js';

import { DeleteVisitAttachmentUseCase } from '../../application/use-cases/delete-visit-attachment.use-case.js';

import { RescheduleVisitDto } from '../dtos/reschedule-visit.dto.js';

import { MarkVisitNotVisitedDto } from '../dtos/mark-visit-not-visited.dto.js';

import { CommercialOutcomeDto } from '../dtos/commercial-outcome.dto.js';

import { CreateFollowUpDto } from '../dtos/create-follow-up.dto.js';

import { FollowUpResponseDto } from '../dtos/follow-up-response.dto.js';

import { VisitAttachmentResponseDto } from '../dtos/visit-attachment-response.dto.js';

interface UploadedFilePayload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('Visits')
@ApiUnauthorizedResponse({ description: 'No active session.' })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('visits')
export class VisitsController {
  constructor(
    private readonly getVisitAgenda: GetVisitAgendaUseCase,
    private readonly getVisitById: GetVisitByIdUseCase,
    private readonly startVisit: StartVisitUseCase,
    private readonly registerVisitResult: RegisterVisitResultUseCase,
    private readonly currentAdvisor: CurrentAdvisorProvider,
    private readonly rescheduleVisit: RescheduleVisitUseCase,
    private readonly markVisitNotVisited: MarkVisitNotVisitedUseCase,
    private readonly registerCommercialOutcome: RegisterCommercialOutcomeUseCase,
    private readonly createFollowUp: CreateFollowUpUseCase,
    private readonly uploadAttachment: UploadVisitAttachmentUseCase,
    private readonly listAttachments: ListVisitAttachmentsUseCase,
    private readonly deleteAttachment: DeleteVisitAttachmentUseCase,
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
    @Req() request: Request,
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
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
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
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async start(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.startVisit.execute(id, advisorId);

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
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async registerResult(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @Body() body: RegisterVisitResultDto,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.registerVisitResult.execute(id, advisorId, {
      endTime: body.endTime,
      observations: body.observations,
      results: body.results,
    });

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a pending visit (HU-26)' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description:
      'Visit moved to RESCHEDULE with its new date; logged in the activity log.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Date in the past or visit already started or closed.',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @Body() body: RescheduleVisitDto,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.rescheduleVisit.execute(id, advisorId, {
      scheduledAt: new Date(body.scheduledAt),
      reason: body.reason,
    });

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/not-visited')
  @ApiOperation({ summary: 'Mark a visit as not done (HU-26)' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({
    status: 200,
    description: 'Visit moved to NOT_VISITED; logged in the activity log.',
    type: VisitDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'The visit is already closed.' })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async notVisited(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @Body() body: MarkVisitNotVisitedDto,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.markVisitNotVisited.execute(
      id,
      advisorId,
      body.reason,
    );

    return new VisitDetailResponseDto(visit);
  }

  @Patch(':id/commercial-outcome')
  @ApiOperation({
    summary: 'Record whether the visit generated a quote or an order (HU-27)',
    description:
      'When quoteGenerated is true the frontend opens the quote form with the client preloaded and sends `visitId` in POST /quotes.',
  })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({ status: 200, type: VisitDetailResponseDto })
  @ApiResponse({
    status: 400,
    description: 'The visit has not started yet or was not done.',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async commercialOutcome(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @Body() body: CommercialOutcomeDto,
  ): Promise<VisitDetailResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const visit = await this.registerCommercialOutcome.execute(id, advisorId, {
      quoteGenerated: body.quoteGenerated,
      orderGenerated: body.orderGenerated,
    });

    return new VisitDetailResponseDto(visit);
  }

  @Post(':id/follow-ups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a follow-up from a visit (HU-25)' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({ status: 201, type: FollowUpResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid follow-up data.' })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async scheduleFollowUp(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @Body() body: CreateFollowUpDto,
  ): Promise<FollowUpResponseDto> {
    const advisorId = await this.currentAdvisor.extract(request);

    const followUp = await this.createFollowUp.execute(id, advisorId, {
      dueDate: new Date(body.dueDate),
      activity: body.activity,
      observation: body.observation,
      responsibleId: body.responsibleId,
    });

    return new FollowUpResponseDto(followUp);
  }

  @Post(':id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Attach a photo or document to a visit (HU-28)' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Photo or document (PDF, PNG, JPG, WebP, CSV, Excel), max 10MB',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: VisitAttachmentResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Missing file, too large or type not allowed.',
  })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async attach(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
    @UploadedFile() file?: UploadedFilePayload,
  ): Promise<VisitAttachmentResponseDto> {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    const advisorId = await this.currentAdvisor.extract(request);

    const result = await this.uploadAttachment.execute(id, advisorId, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    return new VisitAttachmentResponseDto(result);
  }

  @Get(':id/attachments')
  @ApiOperation({
    summary: 'List the files of a visit with signed URLs (HU-28)',
  })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiResponse({ status: 200, type: [VisitAttachmentResponseDto] })
  @ApiResponse({
    status: 404,
    description: 'Visit not found for this advisor.',
  })
  async attachments(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ): Promise<VisitAttachmentResponseDto[]> {
    const advisorId = await this.currentAdvisor.extract(request);

    const results = await this.listAttachments.execute(id, advisorId);

    return results.map((result) => new VisitAttachmentResponseDto(result));
  }

  @Delete(':id/attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a file from a visit (HU-28)' })
  @ApiParam({ name: 'id', description: 'Visit ID' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment ID' })
  @ApiResponse({
    status: 204,
    description: 'File removed from S3 and the visit.',
  })
  @ApiResponse({ status: 404, description: 'Attachment not found.' })
  async removeAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Req() request: Request,
  ): Promise<void> {
    const advisorId = await this.currentAdvisor.extract(request);

    await this.deleteAttachment.execute(id, attachmentId, advisorId);
  }
}
